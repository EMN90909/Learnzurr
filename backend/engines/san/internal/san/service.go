package san

type Service struct{ Repo Repository }

func NewService() Service { return Service{Repo: Repository{}} }
func (s Service) Health() Health {
	return Health{Engine: "san", Status: "ok", Namespace: s.Repo.Namespace()}
}
