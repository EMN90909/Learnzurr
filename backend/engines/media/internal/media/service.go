package media

type Service struct{ Repo Repository }

func NewService() Service { return Service{Repo: Repository{}} }
func (s Service) Health() Health {
	return Health{Engine: "media", Status: "ok", Namespace: s.Repo.Namespace()}
}

func (s Service) SaveBeat(project BeatProject) Result {
	if project.Tempo == 0 {
		project.Tempo = 90
	}
	return Result{ID: "beat-draft", Status: "saved-for-lanmat-review"}
}
func (s Service) RenderCreation(project CreationProject) Result {
	return Result{ID: "media-render", Status: "queued"}
}
