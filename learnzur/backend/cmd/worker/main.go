package main

import (
	"log"
	"time"
)

func main() {
	log.Println("learnzur worker ready for Redis Streams queues")
	for {
		time.Sleep(time.Hour)
	}
}
