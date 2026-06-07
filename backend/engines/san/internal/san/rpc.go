package san

import "context"

type RPCRequest struct {
	Action  string         `json:"action"`
	ActorID string         `json:"actorId"`
	Payload map[string]any `json:"payload"`
}

type RPCResponse struct {
	Engine string         `json:"engine"`
	Status string         `json:"status"`
	Result map[string]any `json:"result"`
}

func InternalRPC(ctx context.Context, req RPCRequest) RPCResponse {
	if req.Payload == nil {
		req.Payload = map[string]any{}
	}
	return RPCResponse{Engine: "san", Status: "accepted", Result: map[string]any{"action": req.Action, "actorId": req.ActorID}}
}

func AllowedRPCActions() []string {
	return []string{"ExecuteCode", "SaveProject", "GetProject", "StreamOutput", "CleanupSession"}
}
