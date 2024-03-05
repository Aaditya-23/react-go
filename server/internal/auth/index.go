package auth

import (
	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/utils"
)

func SendMagicLink(userId int64, email string) (int64, error) {
	var err error
	magicToken, tokenId, err := generateMagicToken(userId)
	if err != nil {
		return tokenId, err
	}

	mssg := "Click on this link to verify yourself\n" + generateLinkFromToken(magicToken)
	err = utils.SendMail([]string{email}, mssg)

	return tokenId, err
}

func VerifyMagicToken(token string) (bool, error) {
	var err error
	isTokenVerified, err := database.VerifyMagicToken(token)
	if err != nil {
		return isTokenVerified, err
	}

	if isTokenVerified {
		err = database.RegisterMagicToken(token)
	}

	return isTokenVerified, err
}

func CheckRegisteredMagicToken(tokenId int64) (bool, error) {
	return database.CheckRegisteredMagicToken(tokenId)
}
