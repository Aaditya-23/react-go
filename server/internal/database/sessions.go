package database

import (
	"time"

	"github.com/Aaditya-23/server/internal/utils"
)

func CreateUserSession(userId int64) (string, time.Time, error) {

	sessionId, err := utils.GenerateUUID()
	expires := time.Now().Add(30 * 24 * time.Hour)
	if err != nil {
		return sessionId, expires, err
	}

	const query = `INSERT INTO sessions (id, user_id, expires) VALUES (?, ?, ?)`

	_, err = db.Exec(query, sessionId, userId, expires)
	return sessionId, expires, err
}

func GetUserIdFromSession(sessionId string) (int64, error) {
	const query = `SELECT user_id from sessions WHERE id = ? AND expires > Now()`
	var userId int64

	err := db.QueryRow(query, sessionId).Scan(&userId)
	return userId, err
}

func DestroySession(sessionId string) error {
	const query = `DELETE FROM sessions WHERE id = ?`

	_, err := db.Exec(query, sessionId)
	return err
}
