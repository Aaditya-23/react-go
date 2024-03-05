package cart_handler

import (
	"github.com/Aaditya-23/server/internal/handler/middlewares"
	"github.com/go-chi/chi/v5"
)

func Mount() *chi.Mux {
	// mounted with /cart
	r := chi.NewRouter()
	r.Route("/", func(r chi.Router) {
		r.Use(middlewares.AuthMiddleware)
		r.Get("/", fetchCart)
		r.Post("/", updateCart)
		r.Post("/order", order)
	})

	return r
}
