package utils

import (
	"encoding/json"
	"net/http"
)

func DecodeJSON(r *http.Request, data any) error {
	return json.NewDecoder(r.Body).Decode(data)
}

func ToJSON(w http.ResponseWriter, code int, data interface{}) {
	res, err := json.Marshal(data)
	w.Header().Set("Content-Type", "application/json")
	if err != nil {
		println("error occured while marshalling data", err.Error())
		w.WriteHeader(500)
		w.Write([]byte(`{"error": "Internal Server Error"}`))
	}

	w.WriteHeader(code)
	w.Write(res)
}
