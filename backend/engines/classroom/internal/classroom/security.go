package classroom

func SecurityRules() []string { return []string{"auth required", "audit every write", "rate limit critical endpoints"} }
