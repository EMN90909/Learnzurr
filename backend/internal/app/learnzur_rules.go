package app

import (
	"errors"
	"fmt"
	"math"
	"regexp"
	"sort"
	"strings"
	"time"
)

type Role string

const (
	RoleParent  Role = "parent"
	RoleTeacher Role = "teacher"
	RoleLearner Role = "learner"
	RoleAdmin   Role = "admin"
)

type AgeBand string

const (
	AgeJunior AgeBand = "junior"
	AgeMiddle AgeBand = "middle"
	AgeSenior AgeBand = "senior"
)

type LearnerProfile struct {
	ID        string
	FullName  string
	Age       int
	County    string
	Subjects  []string
	CreatedAt time.Time
}

type ClassOffer struct {
	ID             string
	Title          string
	Subject        string
	TeacherID      string
	TeacherName    string
	PriceKES       int
	AgeMin         int
	AgeMax         int
	Capacity       int
	Enrolled       int
	StartsAt       time.Time
	Verified       bool
	Moderated      bool
	CertificateRef string
}

type EnrollmentDecision struct {
	Allowed       bool
	Reason        string
	RequiresPay   bool
	RequiresAdult bool
	RiskScore     int
}

func AgeBandFor(age int) AgeBand {
	switch {
	case age <= 10:
		return AgeJunior
	case age <= 14:
		return AgeMiddle
	default:
		return AgeSenior
	}
}

func ValidateClassForLearner(class ClassOffer, learner LearnerProfile) EnrollmentDecision {
	if strings.TrimSpace(class.ID) == "" || strings.TrimSpace(learner.ID) == "" {
		return EnrollmentDecision{Allowed: false, Reason: "missing class or learner identifier", RiskScore: 100}
	}
	if !class.Verified {
		return EnrollmentDecision{Allowed: false, Reason: "teacher verification is not complete", RiskScore: 80}
	}
	if !class.Moderated {
		return EnrollmentDecision{Allowed: false, Reason: "class is waiting for moderation", RiskScore: 60}
	}
	if learner.Age < class.AgeMin || learner.Age > class.AgeMax {
		return EnrollmentDecision{Allowed: false, Reason: "learner age is outside class range", RiskScore: 40}
	}
	if class.Enrolled >= class.Capacity {
		return EnrollmentDecision{Allowed: false, Reason: "class capacity is full", RiskScore: 20}
	}
	return EnrollmentDecision{Allowed: true, Reason: "class is available", RequiresPay: class.PriceKES > 0, RequiresAdult: learner.Age < 18, RiskScore: 0}
}

type Split struct {
	Receiver  string
	AmountKES int
	Memo      string
}

type SplitConfig struct {
	TeacherPct  int
	PlatformPct int
	RewardPct   int
	TaxPct      int
}

func DefaultSplitConfig() SplitConfig {
	return SplitConfig{TeacherPct: 82, PlatformPct: 10, RewardPct: 5, TaxPct: 3}
}

func ComputeTransactionSplit(amountKES int, cfg SplitConfig) ([]Split, error) {
	if amountKES <= 0 {
		return nil, errors.New("amount must be positive")
	}
	totalPct := cfg.TeacherPct + cfg.PlatformPct + cfg.RewardPct + cfg.TaxPct
	if totalPct != 100 {
		return nil, fmt.Errorf("split percentage must equal 100, got %d", totalPct)
	}
	teacher := int(math.Round(float64(amountKES) * float64(cfg.TeacherPct) / 100))
	platform := int(math.Round(float64(amountKES) * float64(cfg.PlatformPct) / 100))
	reward := int(math.Round(float64(amountKES) * float64(cfg.RewardPct) / 100))
	tax := amountKES - teacher - platform - reward
	return []Split{{"teacher", teacher, "educator earning"}, {"platform", platform, "operations"}, {"rewards", reward, "learner prizes"}, {"tax", tax, "tax reserve"}}, nil
}

var phoneRE = regexp.MustCompile(`^2547[0-9]{8}$`)

func NormalizeKenyanPhone(phone string) (string, error) {
	clean := strings.NewReplacer(" ", "", "-", "", "+", "").Replace(strings.TrimSpace(phone))
	if strings.HasPrefix(clean, "07") && len(clean) == 10 {
		clean = "254" + clean[1:]
	}
	if !phoneRE.MatchString(clean) {
		return "", fmt.Errorf("phone must be a Kenyan Safaricom format number")
	}
	return clean, nil
}

type ModerationResult struct {
	Decision string
	Severity int
	Reasons  []string
}

func ModerateLearningText(input string, childFacing bool) ModerationResult {
	text := strings.ToLower(strings.TrimSpace(input))
	severity := 0
	reasons := []string{}
	checks := map[string]int{"payment outside platform": 35, "send me your number": 30, "insult": 25, "explicit": 90, "exam leak": 85, "meet alone": 80}
	for phrase, score := range checks {
		if strings.Contains(text, phrase) {
			severity += score
			reasons = append(reasons, phrase)
		}
	}
	if childFacing && severity > 0 {
		severity += 15
	}
	decision := "allow"
	if severity >= 90 {
		decision = "strike"
	} else if severity >= 70 {
		decision = "block"
	} else if severity >= 35 {
		decision = "hold_for_review"
	}
	if len(reasons) == 0 {
		reasons = append(reasons, "no policy issue detected")
	}
	return ModerationResult{Decision: decision, Severity: severity, Reasons: reasons}
}

type LeaderboardEntry struct {
	LearnerID string
	Name      string
	Points    int
	Streak    int
}

func RankLeaderboard(entries []LeaderboardEntry) []LeaderboardEntry {
	copyEntries := append([]LeaderboardEntry(nil), entries...)
	sort.SliceStable(copyEntries, func(i, j int) bool {
		if copyEntries[i].Points == copyEntries[j].Points {
			return copyEntries[i].Streak > copyEntries[j].Streak
		}
		return copyEntries[i].Points > copyEntries[j].Points
	})
	return copyEntries
}
