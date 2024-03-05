package main

import (
	"net/http"
	"os"

	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/handler"
	_ "github.com/go-sql-driver/mysql"
	"github.com/joho/godotenv"
)

func main() {
	godotenv.Load()
	port := os.Getenv("PORT")
	if port == "" {
		println("PORT env is not set")
		return
	}

	database.Init()
	defer database.Close()

	r := handler.Mount()

	println("Starting the server on port " + port)
	err := http.ListenAndServe(":"+port, r)
	if err != nil {
		println("Failed to start the server")
	}
}
