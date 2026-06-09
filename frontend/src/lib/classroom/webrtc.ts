export type RTCSignal = { type: 'offer' | 'answer' | 'candidate'; payload: unknown };
export async function createPeerConnection(onSignal: (signal: RTCSignal) => void) {
  const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] });
  pc.onicecandidate = (event) => { if (event.candidate) onSignal({ type: 'candidate', payload: event.candidate }); };
  return pc;
}
export async function getClassroomMedia() { return navigator.mediaDevices.getUserMedia({ audio: true, video: true }); }
