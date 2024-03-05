package product_handler

import (
	"github.com/Aaditya-23/server/internal/handler/middlewares"
	"github.com/go-chi/chi/v5"
)

func Mount() *chi.Mux {
	// mounted with /product
	r := chi.NewRouter()

	r.Route("/", func(r chi.Router) {
		r.Use(middlewares.AuthMiddleware)
		r.Post("/", createProduct)
		r.Post("/delete", deleteProduct)
	})

	r.Get("/{offset}-{limit}", fetchProducts)
	r.Get("/{id}", fetchProduct)

	return r

}
