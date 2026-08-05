package main

import (
  "errors"
  "log"
  "net"
  "os"
  "strconv"

  "github.com/pion/logging"
  "github.com/pion/transport/v4/stdnet"
  "github.com/pion/turn/v5"
)

var embeddedTURN *turn.Server

func init() {
  if os.Getenv("TURN_ENABLE") != "true" {
    return
  }
  server, err := startEmbeddedTURN()
  if err != nil {
    log.Printf("embedded STUN/TURN disabled: %v", err)
    return
  }
  embeddedTURN = server
}

func startEmbeddedTURN() (*turn.Server, error) {
  publicIP := net.ParseIP(os.Getenv("TURN_PUBLIC_IP"))
  if publicIP == nil {
    return nil, errors.New("TURN_PUBLIC_IP must be a valid public IPv4 address")
  }
  username := os.Getenv("TURN_USERNAME")
  password := os.Getenv("TURN_PASSWORD")
  if username == "" || password == "" {
    return nil, errors.New("TURN_USERNAME and TURN_PASSWORD are required")
  }
  realm := os.Getenv("TURN_REALM")
  if realm == "" {
    realm = "learnzurr"
  }
  port := os.Getenv("TURN_PORT")
  if port == "" {
    port = "3478"
  }

  packetConnection, err := net.ListenPacket("udp4", ":"+port)
  if err != nil {
    return nil, err
  }
  network, err := stdnet.NewNet()
  if err != nil {
    _ = packetConnection.Close()
    return nil, err
  }

  minPort := envPort("TURN_MIN_PORT", 49160)
  maxPort := envPort("TURN_MAX_PORT", 49200)
  if minPort > maxPort {
    _ = packetConnection.Close()
    return nil, errors.New("TURN_MIN_PORT must not exceed TURN_MAX_PORT")
  }

  server, err := turn.NewServer(turn.ServerConfig{
    Realm: realm,
    AuthHandler: func(candidate, requestRealm string, _ net.Addr) ([]byte, bool) {
      if candidate != username {
        return nil, false
      }
      return turn.GenerateAuthKey(candidate, requestRealm, password), true
    },
    PacketConnConfigs: []turn.PacketConnConfig{{
      PacketConn: packetConnection,
      RelayAddressGenerator: &turn.RelayAddressGeneratorPortRange{
        RelayAddress: publicIP,
        Address: "0.0.0.0",
        MinPort: minPort,
        MaxPort: maxPort,
        MaxRetries: 20,
        Net: network,
      },
    }},
    LoggerFactory: logging.NewDefaultLoggerFactory(),
    InboundMTU: 1200,
  })
  if err != nil {
    _ = packetConnection.Close()
    return nil, err
  }
  log.Printf("Learnzurr embedded STUN/TURN listening on UDP :%s with relay ports %d-%d", port, minPort, maxPort)
  return server, nil
}

func envPort(name string, fallback uint16) uint16 {
  value, err := strconv.Atoi(os.Getenv(name))
  if err != nil || value < 1 || value > 65535 {
    return fallback
  }
  return uint16(value)
}
