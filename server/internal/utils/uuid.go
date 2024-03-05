package utils

import (
	"errors"

	"github.com/google/uuid"
)

func GenerateUUID() (string, error) {
	var err error
	UUID := uuid.NewString()
	defer handleUUIDPanic(&err)

	return UUID, err
}

func handleUUIDPanic(err *error) {
	if r := recover(); r != nil {
		*err = errors.New("recovered from panic caused by generating UUID")
	}
}
