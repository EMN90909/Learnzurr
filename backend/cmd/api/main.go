package main

import "log"

func main() {
	srv := newServer(routes())
	log.Println("Learnzur API listening on", srv.Addr)
	log.Fatal(srv.ListenAndServe())
}
