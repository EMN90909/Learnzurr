package platform

import "math"

type Split struct { Teacher int; Platform int; Rewards int; TaxReserve int; Founder int }

type MoneyBreakdown struct { GrossKES int; TeacherKES int; PlatformKES int; RewardsKES int; TaxReserveKES int; FounderKES int }

func CalculateClassSplit(amountKES int, split Split) MoneyBreakdown {
    if amountKES < 0 { amountKES = 0 }
    total := split.Teacher + split.Platform + split.Rewards + split.TaxReserve + split.Founder
    if total <= 0 { split = Split{Teacher:70, Platform:15, Rewards:5, TaxReserve:5, Founder:5}; total = 100 }
    round := func(p int) int { return int(math.Round(float64(amountKES*p)/float64(total))) }
    b := MoneyBreakdown{GrossKES: amountKES, TeacherKES: round(split.Teacher), PlatformKES: round(split.Platform), RewardsKES: round(split.Rewards), TaxReserveKES: round(split.TaxReserve), FounderKES: round(split.Founder)}
    drift := amountKES - (b.TeacherKES+b.PlatformKES+b.RewardsKES+b.TaxReserveKES+b.FounderKES)
    b.PlatformKES += drift
    return b
}

func CanEnroll(c Class, learnerAge int) bool { return c.Status == "published" && c.Enrolled < c.Capacity && learnerAge >= c.AgeMin && learnerAge <= c.AgeMax }
func RoyaltyForMarketplace(amountKES int) int { if amountKES <= 0 { return 0 }; return int(math.Round(float64(amountKES)*0.90)) }
func PlatformTakeForMarketplace(amountKES int) int { return amountKES - RoyaltyForMarketplace(amountKES) }
