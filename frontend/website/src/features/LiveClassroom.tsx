import { useEffect, useMemo, useRef, useState } from "react";
import { Mic, MonitorUp, Send, Signal, Video, VideoOff, X } from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api";

type JoinResponse = {
  session: {
    id: string;
    name: string;
    starts_at: string;
    ends_at: string;
    status: string;
  };
  role: "teacher" | "learner";
  userId: string;
  websocketUrl: string;
  iceServers: RTCIceServer[];
  media: {
    width: number;
    height: number;
    maxHeight: number;
    maxBitrate: number;
    maxLearners: number;
    maxTeachers: number;
  };
};

type SignalMessage = {
  type: string;
  from?: string;
  to?: string;
  role?: string;
  payload?: unknown;
};

type ChatMessage = {
  id: string;
  author: string;
  text: string;
  kind: "chat" | "question";
  createdAt: string;
};

const qualityOptions = {
  "144p": { width: 256, height: 144, bitrate: 160_000 },
  "200p": { width: 320, height: 200, bitrate: 220_000 },
  "244p": { width: 426, height: 240, bitrate: 250_000 },
} as const;

export function LiveClassroom() {
  const { sessionId = "" } = useParams();
  const navigate = useNavigate();
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const socket = useRef<WebSocket | null>(null);
  const localStream = useRef<MediaStream | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const pendingLearners = useRef(new Set<string>());
  const [join, setJoin] = useState<JoinResponse | null>(null);
  const [status, setStatus] = useState("Authorizing classroom…");
  const [quality, setQuality] = useState<keyof typeof qualityOptions>("200p");
  const [broadcasting, setBroadcasting] = useState(false);
  const [screenSharing, setScreenSharing] = useState(false);
  const [participants, setParticipants] = useState(0);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState("");
  const [questionMode, setQuestionMode] = useState(false);
  const [drawing, setDrawing] = useState(false);

  const title = join?.session.name ?? "Live classroom";
  const role = join?.role;
  const isTeacher = role === "teacher";

  const send = (type: string, payload?: unknown, to?: string) => {
    if (socket.current?.readyState !== WebSocket.OPEN) return;
    socket.current.send(JSON.stringify({ type, payload, to }));
  };

  const createPeer = (peerId: string, teacherSide: boolean) => {
    const existing = peers.current.get(peerId);
    if (existing) return existing;

    const peer = new RTCPeerConnection({ iceServers: join?.iceServers ?? [] });
    peer.onicecandidate = (event) => {
      if (event.candidate) send("ice", event.candidate.toJSON(), peerId);
    };
    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) {
        peer.close();
        peers.current.delete(peerId);
        setParticipants(peers.current.size);
      }
    };
    if (!teacherSide) {
      peer.ontrack = (event) => {
        if (remoteVideo.current && event.streams[0]) {
          remoteVideo.current.srcObject = event.streams[0];
          void remoteVideo.current.play().catch(() => undefined);
        }
      };
    }
    peers.current.set(peerId, peer);
    setParticipants(peers.current.size);
    return peer;
  };

  const makeOffer = async (learnerId: string) => {
    const stream = localStream.current;
    if (!stream) {
      pendingLearners.current.add(learnerId);
      send("waiting_for_teacher", { message: "The teacher is preparing the broadcast." }, learnerId);
      return;
    }
    const peer = createPeer(learnerId, true);
    for (const track of stream.getTracks()) {
      if (!peer.getSenders().some((sender) => sender.track?.kind === track.kind)) {
        peer.addTrack(track, stream);
      }
    }
    await applyBitrate(peer, qualityOptions[quality].bitrate);
    const offer = await peer.createOffer();
    await peer.setLocalDescription(offer);
    send("offer", offer, learnerId);
  };

  const handleSignal = async (signal: SignalMessage) => {
    try {
      if (signal.type === "presence") {
        const payload = signal.payload as { participants?: number };
        if (payload?.participants !== undefined) setParticipants(payload.participants);
        return;
      }
      if (signal.type === "ready" && isTeacher && signal.from) {
        await makeOffer(signal.from);
        return;
      }
      if (signal.type === "offer" && !isTeacher && signal.from) {
        const peer = createPeer(signal.from, false);
        await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        send("answer", answer, signal.from);
        return;
      }
      if (signal.type === "answer" && isTeacher && signal.from) {
        const peer = peers.current.get(signal.from);
        if (peer) await peer.setRemoteDescription(signal.payload as RTCSessionDescriptionInit);
        return;
      }
      if (signal.type === "ice" && signal.from) {
        const peer = peers.current.get(signal.from);
        if (peer && signal.payload) await peer.addIceCandidate(signal.payload as RTCIceCandidateInit);
        return;
      }
      if (signal.type === "chat" || signal.type === "question") {
        const payload = signal.payload as ChatMessage;
        setMessages((current) => [...current.slice(-99), payload]);
        return;
      }
      if (signal.type === "whiteboard") {
        drawRemote(signal.payload as DrawPayload);
        return;
      }
      if (signal.type === "room_full") setStatus("This classroom has reached its participant limit.");
      if (signal.type === "teacher_left" && !isTeacher) setStatus("The teacher has left the classroom.");
    } catch (error) {
      console.error("Signal handling failed", error);
      setStatus("The live connection could not process an update.");
    }
  };

  useEffect(() => {
    let cancelled = false;
    api<JoinResponse>(`/api/live-sessions/${sessionId}/token`)
      .then((result) => {
        if (!cancelled) {
          setJoin(result);
          setStatus("Connecting to the signaling server…");
        }
      })
      .catch((error: Error) => setStatus(error.message));
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  useEffect(() => {
    if (!join) return;
    const ws = new WebSocket(join.websocketUrl);
    socket.current = ws;
    ws.onopen = () => {
      setStatus(join.role === "teacher" ? "Ready to start the teacher broadcast." : "Waiting for the teacher broadcast.");
      if (join.role === "learner") send("ready", { receiveOnly: true });
    };
    ws.onmessage = (event) => {
      const signal = JSON.parse(event.data as string) as SignalMessage;
      void handleSignal(signal);
    };
    ws.onerror = () => setStatus("The signaling connection encountered an error.");
    ws.onclose = () => setStatus("The classroom connection closed.");

    return () => {
      ws.close();
      socket.current = null;
      localStream.current?.getTracks().forEach((track) => track.stop());
      localStream.current = null;
      peers.current.forEach((peer) => peer.close());
      peers.current.clear();
    };
  }, [join]);

  const startCamera = async () => {
    if (!join || !isTeacher) return;
    const selected = qualityOptions[quality];
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        width: { ideal: selected.width, max: 426 },
        height: { ideal: selected.height, max: join.media.maxHeight },
        frameRate: { ideal: 10, max: 15 },
      },
      audio: { echoCancellation: true, noiseSuppression: true },
    });
    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = stream;
    if (localVideo.current) {
      localVideo.current.srcObject = stream;
      localVideo.current.muted = true;
      await localVideo.current.play();
    }
    setBroadcasting(true);
    setStatus("Broadcasting lightweight teacher video.");
    send("stream_status", { active: true, quality, bitrate: selected.bitrate });
    const waiting = [...pendingLearners.current];
    pendingLearners.current.clear();
    await Promise.all(waiting.map(makeOffer));
  };

  const stopCamera = () => {
    localStream.current?.getTracks().forEach((track) => track.stop());
    localStream.current = null;
    peers.current.forEach((peer) => peer.close());
    peers.current.clear();
    setBroadcasting(false);
    setParticipants(0);
    send("stream_status", { active: false });
    setStatus("Broadcast stopped.");
  };

  const changeQuality = async (next: keyof typeof qualityOptions) => {
    setQuality(next);
    const selected = qualityOptions[next];
    const videoTrack = localStream.current?.getVideoTracks()[0];
    await videoTrack?.applyConstraints({
      width: { ideal: selected.width },
      height: { ideal: selected.height },
      frameRate: { ideal: 10, max: 15 },
    });
    await Promise.all([...peers.current.values()].map((peer) => applyBitrate(peer, selected.bitrate)));
    send("stream_status", { active: broadcasting, quality: next, bitrate: selected.bitrate });
  };

  const shareScreen = async () => {
    if (!isTeacher || !localStream.current) return;
    const display = await navigator.mediaDevices.getDisplayMedia({
      video: { frameRate: { ideal: 8, max: 12 } },
      audio: false,
    });
    const screenTrack = display.getVideoTracks()[0];
    const cameraTrack = localStream.current.getVideoTracks()[0];
    await Promise.all(
      [...peers.current.values()].map(async (peer) => {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        await sender?.replaceTrack(screenTrack);
      }),
    );
    if (localVideo.current) localVideo.current.srcObject = display;
    setScreenSharing(true);
    screenTrack.onended = async () => {
      await Promise.all(
        [...peers.current.values()].map(async (peer) => {
          const sender = peer.getSenders().find((item) => item.track?.kind === "video");
          await sender?.replaceTrack(cameraTrack);
        }),
      );
      if (localVideo.current) localVideo.current.srcObject = localStream.current;
      setScreenSharing(false);
    };
  };

  const postMessage = () => {
    const text = message.trim();
    if (!text || !join) return;
    const item: ChatMessage = {
      id: crypto.randomUUID(),
      author: isTeacher ? "Teacher" : "Learner",
      text,
      kind: questionMode ? "question" : "chat",
      createdAt: new Date().toISOString(),
    };
    setMessages((current) => [...current, item]);
    send(item.kind, item);
    setMessage("");
  };

  const draw = (event: React.PointerEvent<HTMLCanvasElement>) => {
    if (!drawing || !canvas.current) return;
    const rectangle = canvas.current.getBoundingClientRect();
    const payload: DrawPayload = {
      x: (event.clientX - rectangle.left) / rectangle.width,
      y: (event.clientY - rectangle.top) / rectangle.height,
      color: isTeacher ? "#16a085" : "#4263eb",
      size: 3,
    };
    drawRemote(payload);
    send("whiteboard", payload);
  };

  const roomState = useMemo(
    () => `${participants} connected · ${isTeacher ? "teacher broadcast" : "receive-only learner"}`,
    [participants, isTeacher],
  );

  return (
    <div className="classroom-shell">
      <header className="classroom-topbar">
        <div>
          <p className="eyebrow">Live classroom</p>
          <h1>{title}</h1>
          <span className="connection"><Signal size={15} /> {status}</span>
        </div>
        <div className="classroom-meta">
          <span>{roomState}</span>
          <button className="icon-button" onClick={() => navigate(-1)} aria-label="Leave classroom"><X /></button>
        </div>
      </header>

      <main className="classroom-grid">
        <section className="stage panel">
          <div className="video-frame">
            <video ref={isTeacher ? localVideo : remoteVideo} playsInline autoPlay />
            {!broadcasting && isTeacher && <div className="video-placeholder"><VideoOff /><p>Start the camera when you are ready.</p></div>}
            {!isTeacher && <div className="quality-badge">Receive only · 200–244p</div>}
          </div>

          {isTeacher && (
            <div className="broadcast-controls">
              {!broadcasting ? (
                <button className="button primary" onClick={() => void startCamera()}><Video size={18} />Start broadcast</button>
              ) : (
                <button className="button danger" onClick={stopCamera}><VideoOff size={18} />Stop</button>
              )}
              <button className="button secondary" disabled={!broadcasting} onClick={() => void shareScreen()}><MonitorUp size={18} />{screenSharing ? "Sharing screen" : "Share screen"}</button>
              <label className="quality-control">Quality
                <select value={quality} onChange={(event) => void changeQuality(event.target.value as keyof typeof qualityOptions)}>
                  {Object.keys(qualityOptions).map((option) => <option key={option}>{option}</option>)}
                </select>
              </label>
              <span className="media-note"><Mic size={16} /> Max 250 kbps video · 10–15 fps</span>
            </div>
          )}

          <div className="whiteboard-wrap">
            <div className="section-title"><h2>Shared whiteboard</h2><span>Canvas events sync through WebSocket</span></div>
            <canvas
              ref={canvas}
              width={960}
              height={420}
              onPointerDown={(event) => { setDrawing(true); event.currentTarget.setPointerCapture(event.pointerId); }}
              onPointerMove={draw}
              onPointerUp={() => setDrawing(false)}
              onPointerLeave={() => setDrawing(false)}
            />
          </div>
        </section>

        <aside className="classroom-chat panel">
          <div className="section-title"><h2>Chat & Q&A</h2><span>{messages.length} messages</span></div>
          <div className="message-list">
            {messages.length === 0 && <p className="empty-state">Questions and class chat will appear here.</p>}
            {messages.map((item) => (
              <article className={item.kind === "question" ? "message question" : "message"} key={item.id}>
                <b>{item.kind === "question" ? "Question" : item.author}</b>
                <p>{item.text}</p>
                <small>{new Date(item.createdAt).toLocaleTimeString()}</small>
              </article>
            ))}
          </div>
          <div className="composer">
            <label><input type="checkbox" checked={questionMode} onChange={(event) => setQuestionMode(event.target.checked)} />Ask as a question</label>
            <div>
              <input value={message} onChange={(event) => setMessage(event.target.value)} onKeyDown={(event) => { if (event.key === "Enter") postMessage(); }} placeholder="Write a message…" />
              <button onClick={postMessage} aria-label="Send message"><Send size={18} /></button>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

type DrawPayload = { x: number; y: number; color: string; size: number };

async function applyBitrate(peer: RTCPeerConnection, bitrate: number) {
  const sender = peer.getSenders().find((item) => item.track?.kind === "video");
  if (!sender) return;
  const parameters = sender.getParameters();
  parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
  parameters.encodings[0].maxBitrate = bitrate;
  parameters.degradationPreference = "maintain-framerate";
  await sender.setParameters(parameters);
}

function drawRemote(payload: DrawPayload) {
  const target = document.querySelector<HTMLCanvasElement>(".whiteboard-wrap canvas");
  const context = target?.getContext("2d");
  if (!target || !context || !payload) return;
  context.fillStyle = payload.color;
  context.beginPath();
  context.arc(payload.x * target.width, payload.y * target.height, payload.size, 0, Math.PI * 2);
  context.fill();
}
