package queue

type Message struct { ID string; Payload []byte }
func Consume(stream string) ([]Message, error) { return nil, nil }
