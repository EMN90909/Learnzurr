package queue

import "context"

type Message struct {
	Stream string
	Values map[string]any
}

var Produced []Message

func Produce(ctx context.Context, stream string, values map[string]any) error {
	Produced = append(Produced, Message{Stream: stream, Values: values})
	return nil
}
