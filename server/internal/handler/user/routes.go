package user_handler

import (
	"github.com/Aaditya-23/server/internal/handler/middlewares"
	"github.com/go-chi/chi/v5"
)

func Mount() *chi.Mux {

	// mounted with /user
	r := chi.NewRouter()
	r.Route("/", func(r chi.Router) {
		r.Use(middlewares.AuthMiddleware)

		r.Get("/profile", fetchProfile)
	})

	r.Post("/auth-with-email", authWithEmail)
	r.Post("/auth-with-google", authWithGoogle)
	r.Get("/auth-with-github", authWithGithub)
	r.Post("/verify-magic-token", verifyMagicToken)
	r.Post("/check-registered-magic-token", checkRegisteredMagicToken)
	r.Post("/logout", logout)

	return r
}
