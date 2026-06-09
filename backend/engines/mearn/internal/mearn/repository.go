package mearn

type Repository struct{}
func (Repository) Health() bool { return true }
