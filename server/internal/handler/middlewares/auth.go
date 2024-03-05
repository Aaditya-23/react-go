package middlewares

import (
	"context"
	"database/sql"
	"net/http"

	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/utils"
)

func AuthMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		cookie, err := r.Cookie("session")
		if err != nil {
			utils.ToJSON(w, 401, nil)
			return
		}
		sessionId := cookie.Value

		userId, err := database.GetUserIdFromSession(sessionId)
		if err != nil {
			if err == sql.ErrNoRows {
				utils.ToJSON(w, 401, utils.ErrResponse{Error: "login to complete this action"})
				return
			}

			println("error occured in auth middleware,", err.Error())
			utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
			return
		}

		ctx := context.WithValue(r.Context(), "userId", userId)

		next.ServeHTTP(w, r.WithContext(ctx))
	})
}
