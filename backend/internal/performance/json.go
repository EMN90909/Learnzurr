package performance

import (
	"encoding/json"
	"io"
	"net/http"
)

const JSONContentType = "application/json; charset=utf-8"

// WriteJSON streams directly to the ResponseWriter instead of creating a full response string.
func WriteJSON(w http.ResponseWriter, status int, payload any) error {
	w.Header().Set("Content-Type", JSONContentType)
	w.WriteHeader(status)
	encoder := json.NewEncoder(w)
	encoder.SetEscapeHTML(true)
	return encoder.Encode(payload)
}

// CopyStream keeps memory use bounded for media and sandbox output responses.
func CopyStream(dst io.Writer, src io.Reader) (int64, error) {
	buf := make([]byte, 32*1024)
	return io.CopyBuffer(dst, src, buf)
}

func RawMessageEnvelope(kind string, raw json.RawMessage) map[string]any {
	return map[string]any{"kind": kind, "payload": raw}
}
