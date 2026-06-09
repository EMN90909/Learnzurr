package flagengine

type Repository struct{}
func (Repository) Health() bool { return true }
