package lanmat

// LanmatCreateExplorePolicy documents how the lanmat engine participates in Learnzur Create + Explore.
func LanmatCreateExplorePolicy() []string {
	return []string{
		"senior learner selling",
		"marketplace approval",
		"parent purchase approval",
		"royalty handoff",
		"public listing review",
	}
}

func CreateExploreSafetyRules() []string {
	return []string{
		"authenticate learner before project action",
		"allow owner-only edit/delete/publish",
		"hide private drafts from Explore",
		"scan published projects through Flag",
		"sanitize titles descriptions comments and reports",
		"log publish report and execution violations",
	}
}

func CreateExploreSpeedRules() []string {
	return []string{
		"use async jobs for heavy work",
		"stream code output when possible",
		"cache popular and recent project cards",
		"use cursor pagination",
		"avoid loading full code or video in list views",
		"prefer thumbnails and signed asset URLs",
	}
}
