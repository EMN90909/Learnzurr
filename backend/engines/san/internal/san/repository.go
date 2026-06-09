package san

type Repository struct{}
func (Repository) Health() bool { return true }
