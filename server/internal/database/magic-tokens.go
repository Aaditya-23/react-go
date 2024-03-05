package database

func CreateMagicToken(token string, userId int64) (int64, error) {
	const query = `INSERT INTO magic_tokens (token, user_id) VALUES (?, ?)`

	result, err := db.Exec(query, token, userId)
	if err != nil {
		return 0, err
	}

	return result.LastInsertId()
}

func VerifyMagicToken(token string) (bool, error) {
	const query = `SELECT EXISTS(SELECT 1 FROM magic_tokens WHERE token = ? AND is_verified = false)`

	var tokenExists bool
	err := db.QueryRow(query, token).Scan(&tokenExists)

	return tokenExists, err
}

func RegisterMagicToken(token string) error {
	const query = `UPDATE magic_tokens SET is_verified = true WHERE token = ?`

	_, err := db.Exec(query, token)
	return err
}

func CheckRegisteredMagicToken(tokenId int64) (bool, error) {
	const query = `SELECT EXISTS(SELECT 1 FROM magic_tokens WHERE id = ? AND is_verified = true)`
	var tokenVerified bool

	err := db.QueryRow(query, tokenId).Scan(&tokenVerified)
	return tokenVerified, err
}

func GetUserIdFromRegisteredMagicToken(tokenId int64) (int64, error) {
	const query = `SELECT user_id FROM magic_tokens WHERE id = ? AND is_verified = true`

	var userId int64
	err := db.QueryRow(query, tokenId).Scan(&userId)

	return userId, err
}
