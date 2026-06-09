package contracts

type EngineName string
const ( EngineGamfy EngineName="gamfy"; EngineMearn EngineName="mearn"; EngineLMS EngineName="lms"; EngineClassroom EngineName="classroom"; EngineSan EngineName="san"; EngineLanmat EngineName="lanmat"; EngineNotify EngineName="notify"; EngineMedia EngineName="media"; EngineFind EngineName="find"; EngineFlag EngineName="flag" )

type RPCEnvelope struct { RequestID string `json:"requestId"`; Engine EngineName `json:"engine"`; Operation string `json:"operation"`; ActorID string `json:"actorId"`; SubjectID string `json:"subjectId"`; IdempotencyKey string `json:"idempotencyKey"`; Payload map[string]any `json:"payload"` }
type RPCResult struct { RequestID string `json:"requestId"`; Accepted bool `json:"accepted"`; Status string `json:"status"`; Events []DomainEvent `json:"events"`; Errors []string `json:"errors"` }
type DomainEvent struct { Topic string `json:"topic"`; Key string `json:"key"`; Payload map[string]any `json:"payload"` }
func ValidateEnvelope(e RPCEnvelope) []string { out:=[]string{}; if e.RequestID=="" { out=append(out,"request id is required") }; if e.Engine=="" { out=append(out,"engine is required") }; if e.Operation=="" { out=append(out,"operation is required") }; if e.IdempotencyKey=="" { out=append(out,"idempotency key is required") }; return out }
func Success(e RPCEnvelope, events ...DomainEvent) RPCResult { return RPCResult{RequestID:e.RequestID,Accepted:true,Status:"accepted",Events:events} }
func Failure(e RPCEnvelope, errors ...string) RPCResult { return RPCResult{RequestID:e.RequestID,Accepted:false,Status:"rejected",Errors:errors} }
