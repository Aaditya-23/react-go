package database

import (
	"database/sql"
	"os"
)

var db *sql.DB

func Init() {
	db_env := os.Getenv("DB_URL")
	if db_env == "" {
		println("DB env is not set")
		os.Exit(1)
	}

	if dbConn, err := sql.Open("mysql", db_env); err != nil {
		println("Failed to connect to database")
		os.Exit(1)
	} else {
		db = dbConn
	}
}

func Close() {
	db.Close()
}
