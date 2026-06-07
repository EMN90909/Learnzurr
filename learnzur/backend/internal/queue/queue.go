package queue

type Job struct {
	ID, Engine, Type string
	Payload          map[string]any
}
type Publisher interface{ Publish(Job) error }
