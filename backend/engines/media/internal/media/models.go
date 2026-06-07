package media

type Health struct {
	Engine    string `json:"engine"`
	Status    string `json:"status"`
	Namespace string `json:"namespace"`
}
type Result struct {
	ID     string `json:"id"`
	Status string `json:"status"`
}

type CreationProject struct {
	ID       string `json:"id"`
	Kind     string `json:"kind"`
	Title    string `json:"title"`
	AgeMode  string `json:"ageMode"`
	Status   string `json:"status"`
	Sellable bool   `json:"sellable"`
}
type AnimationTool struct {
	Name     string `json:"name"`
	Simple   string `json:"simple"`
	Advanced string `json:"advanced"`
}
type BeatProject struct {
	Title          string `json:"title"`
	Tempo          int    `json:"tempo"`
	License        string `json:"license"`
	PriceKES       int    `json:"priceKes"`
	ReviewRequired bool   `json:"reviewRequired"`
}
