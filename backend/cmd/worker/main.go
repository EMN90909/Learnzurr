package main

import (
	"context"
	"log"
	"time"
)

func main() {
	log.Println("Learnzur worker started")
	for {
		Dispatch(context.Background(), Job{Type: "heartbeat"})
		time.Sleep(30 * time.Second)
	}
}
