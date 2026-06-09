package platform

import "testing"

func TestCalculateClassSplit(t *testing.T) { b := CalculateClassSplit(800, Split{Teacher:70, Platform:15, Rewards:5, TaxReserve:5, Founder:5}); if b.GrossKES != b.TeacherKES+b.PlatformKES+b.RewardsKES+b.TaxReserveKES+b.FounderKES { t.Fatalf("split does not balance: %+v", b) } }
func TestCanEnroll(t *testing.T) { c := Class{Status:"published", Enrolled:49, Capacity:50, AgeMin:8, AgeMax:12}; if !CanEnroll(c, 10) { t.Fatal("expected enrollment allowed") }; if CanEnroll(c, 14) { t.Fatal("expected age restriction") } }
func TestValidation(t *testing.T) { if !IsEmail("parent@learnzur.co.ke") { t.Fatal("email should validate") }; if !IsKenyanPhone("0712345678") { t.Fatal("phone should validate") } }
