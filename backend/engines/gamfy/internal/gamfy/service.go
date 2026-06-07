package gamfy

type Service struct{ Repo Repository }

func NewService() Service { return Service{Repo: Repository{}} }
func (s Service) Health() Health {
	return Health{Engine: "gamfy", Status: "ok", Namespace: s.Repo.Namespace()}
}
