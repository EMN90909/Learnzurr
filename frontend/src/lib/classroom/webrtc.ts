export type ClassroomSignal = { type: 'offer'|'answer'|'candidate'; payload: unknown };
export class LearnzurWebRTC {
  private peer?: RTCPeerConnection;
  connect() { this.peer = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] }); return this.peer; }
  async close() { this.peer?.close(); this.peer = undefined; }
}
