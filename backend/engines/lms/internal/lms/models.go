package lms

type Health struct {
	Engine    string `json:"engine"`
	Status    string `json:"status"`
	Namespace string `json:"namespace"`
}
type Result struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}
