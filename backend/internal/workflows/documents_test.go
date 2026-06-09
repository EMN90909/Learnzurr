package workflows
import ("testing"; "time")
func TestAccess(t *testing.T){ d:=DecideAccess(Actor{ID:"a",Role:"teacher",Verified:true}, Resource{ID:"r",OwnerID:"a",Kind:"class"}, "write"); if !d.Allowed { t.Fatal(d) } }
func TestGrade(t *testing.T){ g:=ComputeWeightedGrade([]ScoreComponent{{"quiz",80,.4},{"assignment",70,.6}}); if g.Letter!="B" { t.Fatal(g) } }
func TestQueueSort(t *testing.T){ now:=time.Now(); got:=SortReviewQueue([]ReviewItem{{ID:"low",Severity:10,CreatedAt:now},{ID:"high",Severity:80,CreatedAt:now.Add(time.Hour)}}); if got[0].ID!="high" { t.Fatal(got) } }
func TestFinance(t *testing.T){ tr,err:=ApplySplit(1000,82); if err!=nil { t.Fatal(err) }; if tr.Total()!=1000 { t.Fatal(tr) } }
