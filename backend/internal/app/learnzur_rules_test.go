package app

import "testing"

func TestComputeTransactionSplit(t *testing.T) {
	splits, err := ComputeTransactionSplit(1000, DefaultSplitConfig())
	if err != nil {
		t.Fatal(err)
	}
	total := 0
	for _, s := range splits {
		total += s.AmountKES
	}
	if total != 1000 {
		t.Fatalf("expected total 1000 got %d", total)
	}
}

func TestNormalizeKenyanPhone(t *testing.T) {
	got, err := NormalizeKenyanPhone("0712 345 678")
	if err != nil {
		t.Fatal(err)
	}
	if got != "254712345678" {
		t.Fatalf("unexpected phone %s", got)
	}
}

func TestModeration(t *testing.T) {
	result := ModerateLearningText("send me your number", true)
	if result.Decision == "allow" {
		t.Fatalf("expected review decision")
	}
}
