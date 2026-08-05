import { useEffect, useRef, useState } from "react";
import { api, type JoinSessionResult } from "../../lib/api";

interface SignalMessage {
  type: "presence" | "offer" | "answer" | "ice" | "chat" | "question" | "whiteboard" | "leave";
  from?: string;
  to?: string;
  role?: string;
  payload?: any;
}

type QualityPreset = "200p" | "244p";
const qualityConfig: Record<QualityPreset, { width: number; height: number; bitrate: number }> = {
  "200p": { width: 320, height: 200, bitrate: 220_000 },
  "244p": { width: 390, height: 244, bitrate: 250_000 },
};

export function LiveClassroom({ sessionId, token }: { sessionId: string; token: string }) {
  const [join, setJoin] = useState<JoinSessionResult | null>(null);
  const [status, setStatus] = useState("Authorizing classroom…");
  const [quality, setQuality] = useState<QualityPreset>("200p");
  const [messages, setMessages] = useState<{ author: string; text: string; kind: string }[]>([]);
  const [draft, setDraft] = useState("");
  const localVideo = useRef<HTMLVideoElement>(null);
  const remoteVideo = useRef<HTMLVideoElement>(null);
  const socket = useRef<WebSocket | null>(null);
  const peers = useRef(new Map<string, RTCPeerConnection>());
  const stream = useRef<MediaStream | null>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const drawing = useRef(false);

  useEffect(() => {
    let cancelled = false;
    api.joinSession(sessionId, token).then(async (result) => {
      if (cancelled) return;
      setJoin(result);
      if (result.participant.role === "teacher") {
        const preset = qualityConfig["200p"];
        stream.current = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: preset.width, max: qualityConfig["244p"].width },
            height: { ideal: preset.height, max: qualityConfig["244p"].height },
            frameRate: { ideal: 12, max: 15 },
          },
          audio: { echoCancellation: true, noiseSuppression: true },
        });
        if (localVideo.current) localVideo.current.srcObject = stream.current;
      }
      connect(result);
    }).catch((error) => setStatus(error instanceof Error ? error.message : "Unable to join classroom"));
    return () => {
      cancelled = true;
      send({ type: "leave" });
      socket.current?.close();
      peers.current.forEach((peer) => peer.close());
      peers.current.clear();
      stream.current?.getTracks().forEach((track) => track.stop());
    };
  }, [sessionId, token]);

  function connect(result: JoinSessionResult) {
    const url = new URL(result.signalingUrl);
    url.searchParams.set("room", result.session.room);
    url.searchParams.set("session", result.session.id);
    url.searchParams.set("id", result.participant.id);
    url.searchParams.set("role", result.participant.role);
    url.searchParams.set("token", result.socketToken);
    const ws = new WebSocket(url);
    socket.current = ws;
    ws.onopen = () => {
      setStatus("Connected");
      send({ type: "presence", role: result.participant.role, payload: { name: result.participant.name } });
    };
    ws.onclose = (event) => setStatus(event.code === 1000 ? "Classroom closed" : "Disconnected — reconnect to continue");
    ws.onerror = () => setStatus("Signaling connection failed");
    ws.onmessage = async (event) => {
      const message = JSON.parse(event.data) as SignalMessage;
      if (!message.from || message.from === result.participant.id) return;
      if (message.type === "presence" && result.participant.role === "teacher" && message.role === "learner") await makeOffer(message.from, result);
      if (message.type === "offer" && result.participant.role === "learner") {
        const peer = getPeer(message.from, result);
        await peer.setRemoteDescription(message.payload);
        const answer = await peer.createAnswer();
        await peer.setLocalDescription(answer);
        send({ type: "answer", to: message.from, payload: answer });
      }
      if (message.type === "answer") await getPeer(message.from, result).setRemoteDescription(message.payload);
      if (message.type === "ice" && message.payload) await getPeer(message.from, result).addIceCandidate(message.payload).catch(() => undefined);
      if (message.type === "chat" || message.type === "question") {
        setMessages((items) => [...items.slice(-99), { author: message.payload?.name ?? "Participant", text: message.payload?.text ?? "", kind: message.type }]);
      }
      if (message.type === "whiteboard") drawRemote(message.payload);
      if (message.type === "leave") closePeer(message.from);
    };
  }

  function getPeer(id: string, result: JoinSessionResult) {
    const existing = peers.current.get(id);
    if (existing) return existing;
    const peer = new RTCPeerConnection({ iceServers: result.iceServers, bundlePolicy: "max-bundle", rtcpMuxPolicy: "require" });
    peers.current.set(id, peer);
    peer.onicecandidate = (event) => event.candidate && send({ type: "ice", to: id, payload: event.candidate.toJSON() });
    peer.onconnectionstatechange = () => {
      if (["failed", "closed", "disconnected"].includes(peer.connectionState)) closePeer(id);
    };
    peer.ontrack = (event) => {
      if (remoteVideo.current) remoteVideo.current.srcObject = event.streams[0];
    };
    if (result.participant.role === "teacher" && stream.current) {
      stream.current.getTracks().forEach((track) => peer.addTrack(track, stream.current!));
    }
    return peer;
  }

  async function makeOffer(learnerId: string, result: JoinSessionResult) {
    const peer = getPeer(learnerId, result);
    await applyBitrate(peer, quality);
    const offer = await peer.createOffer({ offerToReceiveAudio: false, offerToReceiveVideo: false });
    await peer.setLocalDescription(offer);
    send({ type: "offer", to: learnerId, payload: offer });
  }

  async function applyBitrate(peer: RTCPeerConnection, preset: QualityPreset) {
    for (const sender of peer.getSenders()) {
      if (sender.track?.kind !== "video") continue;
      const parameters = sender.getParameters();
      parameters.encodings = parameters.encodings?.length ? parameters.encodings : [{}];
      parameters.encodings[0].maxBitrate = qualityConfig[preset].bitrate;
      parameters.encodings[0].maxFramerate = 15;
      parameters.degradationPreference = "maintain-framerate";
      await sender.setParameters(parameters).catch(() => undefined);
    }
  }

  async function selectQuality(preset: QualityPreset) {
    setQuality(preset);
    const config = qualityConfig[preset];
    await stream.current?.getVideoTracks()[0]?.applyConstraints({
      width: { ideal: config.width },
      height: { ideal: config.height },
      frameRate: { ideal: 12, max: 15 },
    });
    await Promise.all([...peers.current.values()].map((peer) => applyBitrate(peer, preset)));
  }

  function closePeer(id: string) {
    peers.current.get(id)?.close();
    peers.current.delete(id);
  }

  function send(message: SignalMessage) {
    if (socket.current?.readyState === WebSocket.OPEN) socket.current.send(JSON.stringify(message));
  }

  async function shareScreen() {
    if (!join || join.participant.role !== "teacher") return;
    const display = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: { ideal: 10, max: 12 } }, audio: false });
    const track = display.getVideoTracks()[0];
    await Promise.all([...peers.current.values()].map(async (peer) => {
      const sender = peer.getSenders().find((item) => item.track?.kind === "video");
      if (sender) await sender.replaceTrack(track);
    }));
    if (localVideo.current) localVideo.current.srcObject = display;
    track.onended = async () => {
      const camera = stream.current?.getVideoTracks()[0] ?? null;
      await Promise.all([...peers.current.values()].map(async (peer) => {
        const sender = peer.getSenders().find((item) => item.track?.kind === "video");
        if (sender) await sender.replaceTrack(camera);
      }));
      if (localVideo.current) localVideo.current.srcObject = stream.current;
    };
  }

  function post(kind: "chat" | "question") {
    const text = draft.trim();
    if (!text || !join) return;
    const item = { author: join.participant.name || "You", text, kind };
    setMessages((items) => [...items.slice(-99), item]);
    send({ type: kind, payload: { name: item.author, text } });
    setDraft("");
  }

  function point(event: React.PointerEvent<HTMLCanvasElement>) {
    const rect = event.currentTarget.getBoundingClientRect();
    return { x: (event.clientX - rect.left) / rect.width, y: (event.clientY - rect.top) / rect.height };
  }

  function draw(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!drawing.current) return;
    const p = point(event);
    drawRemote({ ...p, color: "#22c55e", size: 3 });
    send({ type: "whiteboard", payload: { ...p, color: "#22c55e", size: 3 } });
  }

  function drawRemote(payload: { x?: number; y?: number; color?: string; size?: number }) {
    const element = canvas.current;
    if (!element || payload.x == null || payload.y == null) return;
    const context = element.getContext("2d");
    if (!context) return;
    context.fillStyle = payload.color ?? "#111827";
    context.beginPath();
    context.arc(payload.x * element.width, payload.y * element.height, payload.size ?? 3, 0, Math.PI * 2);
    context.fill();
  }

  return <div className="live-room">
    <header className="live-toolbar">
      <div><strong>{join?.session.name ?? "Live classroom"}</strong><small>{status} · teacher broadcast · max 50 learners</small></div>
      {join?.participant.role === "teacher" && <div className="live-actions">
        <select value={quality} onChange={(event) => void selectQuality(event.target.value as QualityPreset)}>
          <option value="200p">200p · 220 kbps</option>
          <option value="244p">244p · 250 kbps</option>
        </select>
        <button onClick={() => void shareScreen()}>Share screen</button>
      </div>}
    </header>
    <div className="live-grid">
      <section className="video-stage">
        <video ref={join?.participant.role === "teacher" ? localVideo : remoteVideo} autoPlay playsInline muted={join?.participant.role === "teacher"}/>
        {join?.participant.role === "teacher" && <video className="remote-preview" ref={remoteVideo} autoPlay playsInline/>}
      </section>
      <aside className="chat-panel">
        <h3>Chat & Q&A</h3>
        <div className="message-list">{messages.map((message, index) => <article key={`${index}-${message.text}`} className={message.kind}><b>{message.author}</b><p>{message.text}</p></article>)}</div>
        <textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Ask a question or send a message"/>
        <div><button onClick={() => post("chat")}>Send</button><button onClick={() => post("question")}>Ask</button></div>
      </aside>
    </div>
    <section className="whiteboard-panel"><h3>Shared whiteboard</h3><canvas ref={canvas} width={1200} height={420} onPointerDown={(event) => { drawing.current = true; event.currentTarget.setPointerCapture(event.pointerId); draw(event); }} onPointerMove={draw} onPointerUp={() => { drawing.current = false; }} onPointerLeave={() => { drawing.current = false; }}/></section>
  </div>;
}
