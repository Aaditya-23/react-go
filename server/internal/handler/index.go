package handler

import (
	cart_handler "github.com/Aaditya-23/server/internal/handler/cart"
	product_handler "github.com/Aaditya-23/server/internal/handler/product"
	user_handler "github.com/Aaditya-23/server/internal/handler/user"
	"github.com/go-chi/chi/v5"
	"github.com/go-chi/cors"
)

func Mount() *chi.Mux {
	r := chi.NewRouter()

	r.Use(cors.New(cors.Options{
		AllowedOrigins:   []string{"http://localhost:3000"},
		AllowedMethods:   []string{"GET", "POST"},
		AllowCredentials: true,
	}).Handler)

	r.Mount("/user", user_handler.Mount())
	r.Mount("/product", product_handler.Mount())
	r.Mount("/cart", cart_handler.Mount())

	return r
}
