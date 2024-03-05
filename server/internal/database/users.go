package database

import "database/sql"

type UserProfile struct {
	Name  *string `json:"name"`
	Email string  `json:"email"`
}

func CheckUserByEmail(email string) (bool, error) {
	const query = `SELECT EXISTS(SELECT 1 FROM users WHERE email = ?)`

	var exists bool
	err := db.QueryRow(query, email).Scan(&exists)
	return exists, err
}

func GetUserId(email string) (int64, error) {
	const query = `SELECT id FROM users WHERE email = ?`

	var userId int64
	err := db.QueryRow(query, email).Scan(&userId)
	if err == sql.ErrNoRows {
		return 0, nil
	}

	return userId, err
}

func CreateUser(email string) error {
	const query = `INSERT INTO users (email) VALUES (?)`

	_, err := db.Exec(query, email)
	return err
}

func CreateUserAndReturnId(email string) (int, error) {
	const query = `INSERT INTO users (email) VALUES (?);
				   SELECT id FROM users WHERE email = ?`

	var user_id int
	err := db.QueryRow(query, email).Scan(&user_id)
	return user_id, err
}

func FetchProfile(userId int64) (UserProfile, error) {
	const query = `SELECT name, email FROM users WHERE id = ?`
	var profile UserProfile

	err := db.QueryRow(query, userId).Scan(&profile.Name, &profile.Email)

	return profile, err
}
