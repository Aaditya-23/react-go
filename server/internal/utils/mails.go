package utils

import (
	"errors"
	"net/smtp"
	"os"
)

func SendMail(to []string, mssg string) error {
	email, password := os.Getenv("EMAIL"), os.Getenv("EMAIL_PASSWORD")

	if email == "" {
		return errors.New("EMAIL ENV is not set")
	} else if password == "" {
		return errors.New("EMAIL_PASSWORD ENV is not set")
	}

	smtpHost, smtpPort := "smtp.gmail.com", "587"

	auth := smtp.PlainAuth("", email, password, smtpHost)
	err := smtp.SendMail(smtpHost+":"+smtpPort, auth, email, to, []byte(mssg))

	return err
}
