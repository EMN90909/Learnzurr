package main

import (
  "encoding/json"
  "log"
  "net/http"
  "os"
  "sync"
  "time"

  "github.com/gorilla/websocket"
  "github.com/pion/webrtc/v4"
)

type Message struct {
  Type string `json:"type"`
  Room string `json:"room"`
  From string `json:"from,omitempty"`
  To string `json:"to,omitempty"`
  Role string `json:"role,omitempty"`
  Payload json.RawMessage `json:"payload,omitempty"`
}
type Client struct { id, role, room string; conn *websocket.Conn; send chan []byte }
type Room struct { teachers map[string]*Client; learners map[string]*Client }
type Hub struct { mu sync.RWMutex; rooms map[string]*Room }

var hub = &Hub{rooms: map[string]*Room{}}
var upgrader = websocket.Upgrader{ReadBufferSize: 2048, WriteBufferSize: 2048, CheckOrigin: func(r *http.Request) bool { return true }}

func (h *Hub) join(c *Client) bool {
  h.mu.Lock(); defer h.mu.Unlock()
  room := h.rooms[c.room]; if room == nil { room=&Room{teachers:map[string]*Client{},learners:map[string]*Client{}}; h.rooms[c.room]=room }
  if c.role=="teacher" { if len(room.teachers)>=2{return false}; room.teachers[c.id]=c } else { if len(room.learners)>=50{return false}; room.learners[c.id]=c }
  return true
}
func (h *Hub) leave(c *Client) { h.mu.Lock(); defer h.mu.Unlock(); if r:=h.rooms[c.room];r!=nil { delete(r.teachers,c.id);delete(r.learners,c.id);if len(r.teachers)+len(r.learners)==0{delete(h.rooms,c.room)} } }
func (h *Hub) relay(c *Client, msg Message) {
  h.mu.RLock(); defer h.mu.RUnlock(); r:=h.rooms[c.room];if r==nil{return};msg.From=c.id;payload,_:=json.Marshal(msg)
  if msg.To!="" { if target:=r.teachers[msg.To];target!=nil{select{case target.send<-payload:default:}};if target:=r.learners[msg.To];target!=nil{select{case target.send<-payload:default:}};return }
  for id,target:=range r.teachers { if id!=c.id{select{case target.send<-payload:default:}} };for id,target:=range r.learners {if id!=c.id{select{case target.send<-payload:default:}}}
}
func readPump(c *Client){defer func(){hub.leave(c);close(c.send);c.conn.Close()}();c.conn.SetReadLimit(64*1024);c.conn.SetReadDeadline(time.Now().Add(70*time.Second));c.conn.SetPongHandler(func(string)error{c.conn.SetReadDeadline(time.Now().Add(70*time.Second));return nil});for{_,data,err:=c.conn.ReadMessage();if err!=nil{return};var msg Message;if json.Unmarshal(data,&msg)==nil{msg.Room=c.room;hub.relay(c,msg)}}}
func writePump(c *Client){ticker:=time.NewTicker(25*time.Second);defer ticker.Stop();for{select{case data,ok:=<-c.send:c.conn.SetWriteDeadline(time.Now().Add(8*time.Second));if !ok{c.conn.WriteMessage(websocket.CloseMessage,[]byte{});return};if c.conn.WriteMessage(websocket.TextMessage,data)!=nil{return};case <-ticker.C:c.conn.SetWriteDeadline(time.Now().Add(8*time.Second));if c.conn.WriteMessage(websocket.PingMessage,nil)!=nil{return}}}}
func signal(w http.ResponseWriter,r *http.Request){room,id,role:=r.URL.Query().Get("room"),r.URL.Query().Get("id"),r.URL.Query().Get("role");if room==""||id==""||(role!="teacher"&&role!="learner"){http.Error(w,"room, id and valid role required",400);return};conn,err:=upgrader.Upgrade(w,r,nil);if err!=nil{return};c:=&Client{id:id,role:role,room:room,conn:conn,send:make(chan []byte,32)};if !hub.join(c){conn.WriteJSON(Message{Type:"room_full"});conn.Close();return};go writePump(c);readPump(c)}
func health(w http.ResponseWriter,_ *http.Request){hub.mu.RLock();rooms:=len(hub.rooms);hub.mu.RUnlock();json.NewEncoder(w).Encode(map[string]any{"ok":true,"rooms":rooms,"maxTeachers":2,"maxLearners":50,"videoTarget":"200-244p","mode":"teacher-broadcast-p2p","iceServers":webrtc.Configuration{ICEServers:[]webrtc.ICEServer{{URLs:[]string{"stun:stun.l.google.com:19302"}}}}})}
func main(){mux:=http.NewServeMux();mux.HandleFunc("/healthz",health);mux.HandleFunc("/ws",signal);port:=os.Getenv("SIGNAL_PORT");if port==""{port="8090"};server:=&http.Server{Addr:":"+port,Handler:mux,ReadHeaderTimeout:5*time.Second};log.Printf("Learnzurr signaling on :%s",port);log.Fatal(server.ListenAndServe())}
