package main

import (
  "crypto/hmac"
  "crypto/sha256"
  "encoding/base64"
  "encoding/json"
  "log"
  "net/http"
  "os"
  "strings"
  "sync"
  "sync/atomic"
  "time"

  "github.com/gorilla/websocket"
  "github.com/pion/webrtc/v4"
)

type Message struct {
  Type string `json:"type"`
  Room string `json:"room,omitempty"`
  From string `json:"from,omitempty"`
  To string `json:"to,omitempty"`
  Role string `json:"role,omitempty"`
  Payload json.RawMessage `json:"payload,omitempty"`
}

type Client struct {
  id, role, room, session string
  conn *websocket.Conn
  send chan []byte
  closed atomic.Bool
}

type Room struct {
  session string
  teachers map[string]*Client
  learners map[string]*Client
  createdAt time.Time
  messages uint64
}

type Hub struct {
  mu sync.RWMutex
  rooms map[string]*Room
  connections atomic.Int64
  relayed atomic.Uint64
  dropped atomic.Uint64
}

var hub = &Hub{rooms: map[string]*Room{}}
var messagePool = sync.Pool{New: func() any { b := make([]byte, 0, 4096); return &b }}
var allowedOrigins = strings.Split(os.Getenv("SIGNAL_ALLOWED_ORIGINS"), ",")
var upgrader = websocket.Upgrader{
  ReadBufferSize: 1024,
  WriteBufferSize: 1024,
  WriteBufferPool: &sync.Pool{New: func() any { return make([]byte, 1024) }},
  CheckOrigin: func(r *http.Request) bool {
    if len(allowedOrigins) == 1 && strings.TrimSpace(allowedOrigins[0]) == "" { return true }
    origin := r.Header.Get("Origin")
    for _, allowed := range allowedOrigins { if strings.TrimSpace(allowed) == origin { return true } }
    return false
  },
}

func validToken(session, room, id, role, token string) bool {
  secret := os.Getenv("SIGNALING_SHARED_SECRET")
  if secret == "" { return os.Getenv("SIGNAL_ALLOW_INSECURE") == "true" }
  mac := hmac.New(sha256.New, []byte(secret))
  mac.Write([]byte(session + ":" + room + ":" + id + ":" + role))
  expected := base64.RawURLEncoding.EncodeToString(mac.Sum(nil))
  return hmac.Equal([]byte(expected), []byte(token))
}

func (h *Hub) join(c *Client) bool {
  h.mu.Lock()
  defer h.mu.Unlock()
  room := h.rooms[c.room]
  if room == nil {
    room = &Room{session: c.session, teachers: map[string]*Client{}, learners: map[string]*Client{}, createdAt: time.Now()}
    h.rooms[c.room] = room
  }
  if room.session != c.session { return false }
  if c.role == "teacher" {
    if len(room.teachers) >= 2 { return false }
    room.teachers[c.id] = c
  } else {
    if len(room.learners) >= 50 { return false }
    room.learners[c.id] = c
  }
  h.connections.Add(1)
  return true
}

func (h *Hub) leave(c *Client) {
  if c.closed.Swap(true) { return }
  h.mu.Lock()
  defer h.mu.Unlock()
  if room := h.rooms[c.room]; room != nil {
    delete(room.teachers, c.id)
    delete(room.learners, c.id)
    if len(room.teachers)+len(room.learners) == 0 { delete(h.rooms, c.room) }
  }
  h.connections.Add(-1)
}

func sendNonBlocking(target *Client, payload []byte) {
  select {
  case target.send <- payload:
  default:
    hub.dropped.Add(1)
  }
}

func (h *Hub) relay(c *Client, msg Message) {
  h.mu.RLock()
  defer h.mu.RUnlock()
  room := h.rooms[c.room]
  if room == nil || room.session != c.session { return }
  msg.From = c.id
  msg.Room = c.room
  payload, err := json.Marshal(msg)
  if err != nil { return }
  atomic.AddUint64(&room.messages, 1)
  h.relayed.Add(1)
  if msg.To != "" {
    if target := room.teachers[msg.To]; target != nil { sendNonBlocking(target, payload) }
    if target := room.learners[msg.To]; target != nil { sendNonBlocking(target, payload) }
    return
  }
  for id, target := range room.teachers { if id != c.id { sendNonBlocking(target, payload) } }
  for id, target := range room.learners { if id != c.id { sendNonBlocking(target, payload) } }
}

func readPump(c *Client) {
  defer func() { hub.leave(c); close(c.send); _ = c.conn.Close() }()
  c.conn.SetReadLimit(96 * 1024)
  _ = c.conn.SetReadDeadline(time.Now().Add(70 * time.Second))
  c.conn.SetPongHandler(func(string) error { return c.conn.SetReadDeadline(time.Now().Add(70 * time.Second)) })
  for {
    _, data, err := c.conn.ReadMessage()
    if err != nil { return }
    if len(data) > 96*1024 { return }
    var msg Message
    if json.Unmarshal(data, &msg) != nil { continue }
    switch msg.Type {
    case "presence", "offer", "answer", "ice", "chat", "question", "whiteboard", "leave":
      msg.Room = c.room
      msg.Role = c.role
      hub.relay(c, msg)
    }
  }
}

func writePump(c *Client) {
  ticker := time.NewTicker(25 * time.Second)
  defer ticker.Stop()
  for {
    select {
    case data, ok := <-c.send:
      _ = c.conn.SetWriteDeadline(time.Now().Add(8 * time.Second))
      if !ok { _ = c.conn.WriteMessage(websocket.CloseMessage, []byte{}); return }
      buffer := messagePool.Get().(*[]byte)
      *buffer = append((*buffer)[:0], data...)
      err := c.conn.WriteMessage(websocket.TextMessage, *buffer)
      *buffer = (*buffer)[:0]
      messagePool.Put(buffer)
      if err != nil { return }
    case <-ticker.C:
      _ = c.conn.SetWriteDeadline(time.Now().Add(8 * time.Second))
      if c.conn.WriteMessage(websocket.PingMessage, nil) != nil { return }
    }
  }
}

func signal(w http.ResponseWriter, r *http.Request) {
  room := r.URL.Query().Get("room")
  id := r.URL.Query().Get("id")
  role := r.URL.Query().Get("role")
  session := r.URL.Query().Get("session")
  token := r.URL.Query().Get("token")
  if room == "" || id == "" || session == "" || (role != "teacher" && role != "learner") {
    http.Error(w, "room, session, id and valid role required", http.StatusBadRequest)
    return
  }
  if !validToken(session, room, id, role, token) {
    http.Error(w, "invalid signaling token", http.StatusUnauthorized)
    return
  }
  conn, err := upgrader.Upgrade(w, r, nil)
  if err != nil { return }
  client := &Client{id: id, role: role, room: room, session: session, conn: conn, send: make(chan []byte, 24)}
  if !hub.join(client) {
    _ = conn.WriteJSON(Message{Type: "room_full"})
    _ = conn.Close()
    return
  }
  go writePump(client)
  readPump(client)
}

func health(w http.ResponseWriter, _ *http.Request) {
  hub.mu.RLock()
  rooms := len(hub.rooms)
  teachers, learners := 0, 0
  for _, room := range hub.rooms { teachers += len(room.teachers); learners += len(room.learners) }
  hub.mu.RUnlock()
  stunURL := os.Getenv("STUN_URL")
  if stunURL == "" { stunURL = "stun:stun.l.google.com:19302" }
  ice := []webrtc.ICEServer{{URLs: []string{stunURL}}}
  if turn := os.Getenv("TURN_URL"); turn != "" {
    ice = append(ice, webrtc.ICEServer{URLs: []string{turn}, Username: os.Getenv("TURN_USERNAME"), Credential: os.Getenv("TURN_CREDENTIAL")})
  }
  w.Header().Set("Content-Type", "application/json")
  _ = json.NewEncoder(w).Encode(map[string]any{
    "ok": true, "rooms": rooms, "connections": hub.connections.Load(), "teachers": teachers, "learners": learners,
    "relayedMessages": hub.relayed.Load(), "droppedMessages": hub.dropped.Load(),
    "maxTeachers": 2, "maxLearners": 50, "videoTarget": "200-244p", "mode": "teacher-broadcast-p2p",
    "iceServers": ice, "turnConfigured": os.Getenv("TURN_URL") != "",
  })
}

func main() {
  mux := http.NewServeMux()
  mux.HandleFunc("/healthz", health)
  mux.HandleFunc("/ws", signal)
  port := os.Getenv("SIGNAL_PORT")
  if port == "" { port = "8090" }
  server := &http.Server{Addr: ":" + port, Handler: mux, ReadHeaderTimeout: 5 * time.Second, IdleTimeout: 75 * time.Second}
  log.Printf("Learnzurr signaling on :%s", port)
  log.Fatal(server.ListenAndServe())
}
