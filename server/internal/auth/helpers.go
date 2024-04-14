package auth

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"time"

	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/utils"
)

func generateMagicToken(userId int64) (string, int64, error) {
	tokenId, err := utils.GenerateUUID()
	if err != nil {
		return tokenId, 0, err
	}

	now := time.Now().Unix()
	data := fmt.Sprintf("%d%s%d", userId, tokenId, now)

	hash := sha256.New()
	if _, err = hash.Write([]byte(data)); err != nil {
		return tokenId, 0, err
	}
	token := hex.EncodeToString(hash.Sum(nil))
	generatedTokenId, err := database.CreateMagicToken(token, userId)
	if err != nil {
		return token, 0, err
	}

	return token, generatedTokenId, err
}

func generateLinkFromToken(token string) string {
	return fmt.Sprintf("%s/auth/magic-link?token=%s", "https://react-go-rouge.vercel.app/", token)
}
