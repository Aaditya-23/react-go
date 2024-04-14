package user_handler

import (
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"

	"github.com/Aaditya-23/server/internal/auth"
	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/utils"
	v "github.com/aaditya-23/validator"
)

func authWithEmail(w http.ResponseWriter, r *http.Request) {

	type ResBody struct {
		Email string `json:"email"`
	}

	var body ResBody
	if err := utils.DecodeJSON(r, &body); err != nil {
		println("error occured while decoding json", err.Error())
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid Request Body"})
		return
	}

	errs := v.String(&body.Email, "email").
		Email().
		Parse()

	if len(errs) > 0 {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: errs[0].Message})
		return
	}

	var (
		user_id int64
		err     error
	)

	user_id, err = database.GetUserId(body.Email)
	if err != nil {
		println("error occured while checking user in the database", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	if user_id == 0 {
		if err := database.CreateUser(body.Email); err != nil {
			println("error occured while creating a user", err.Error())
			utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		}
		user_id, err = database.GetUserId(body.Email)
		if err != nil {
			println("error occured while checking user in the database", err.Error())
			utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
			return
		}
	}

	tokenId, err := auth.SendMagicLink(user_id, body.Email)
	if err != nil {
		println("error occured while sending magic link", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
	}

	utils.ToJSON(w, 202, struct {
		TokenId int64 `json:"tokenId"`
	}{
		tokenId,
	})
}

func verifyMagicToken(w http.ResponseWriter, r *http.Request) {
	type ResBody struct {
		Token *string `json:"token"`
	}

	var body ResBody
	if err := utils.DecodeJSON(r, &body); err != nil {
		println("error occured while decoding json", err.Error())
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid Request Body"})
		return
	}

	errs := v.String(body.Token, "token").
		AbortEarly().
		Parse()

	if len(errs) > 0 {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: errs[0].Message})
		return
	}

	isTokenVerified, err := auth.VerifyMagicToken(*body.Token)
	if err != nil {
		println("error occured while verifying magic token", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	utils.ToJSON(w, 200, struct {
		IsTokenVerified bool `json:"isTokenVerified"`
	}{isTokenVerified})
}

func checkRegisteredMagicToken(w http.ResponseWriter, r *http.Request) {
	type ResBody struct {
		TokenId *int64 `json:"tokenId"`
	}

	var body ResBody
	if err := utils.DecodeJSON(r, &body); err != nil {
		println("error occured while decoding json", err.Error())
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid Request Body"})
		return
	}

	errs := v.Number(body.TokenId, "tokenId").
		Parse()

	if len(errs) > 0 {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: errs[0].Message})
		return
	}

	isTokenRegistered, err := auth.CheckRegisteredMagicToken(*body.TokenId)
	if err != nil {
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	if !isTokenRegistered {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid Token"})
		return
	}

	userId, err := database.GetUserIdFromRegisteredMagicToken(*body.TokenId)
	if err != nil {
		println("error occured while checkingRegisteredMagicToken", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	sessionId, expires, err := database.CreateUserSession(userId)
	if err != nil {
		println("error occured while creating user session", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	utils.SetCookie(w, "session", sessionId, expires)
	utils.ToJSON(w, 200, struct {
		Message string `json:"message"`
	}{"Authentication Successful"})
}

func authWithGithub(w http.ResponseWriter, r *http.Request) {
	type UserDetail struct {
		Name  string  `json:"name"`
		Email *string `json:"email"`
	}

	type EmailDetails struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}

	redirect := func(isSuccess bool) {
		URL := "https://react-go-rouge.vercel.app/auth?"
		if isSuccess {
			URL += "success=auth%20successful"
		} else {
			URL += "error=something%20went%20wrong"
		}

		handler := http.RedirectHandler(URL, http.StatusFound)
		handler.ServeHTTP(w, r)
	}

	code := r.URL.Query().Get("code")
	clientId := os.Getenv("GITHUB_CLIENT_ID")
	clientSecret := os.Getenv("GITHUB_CLIENT_SECRET")

	TOKEN_URL := fmt.Sprintf("https://github.com/login/oauth/access_token?client_id=%s&client_secret=%s&code=%s", clientId, clientSecret, code)

	tokenRes, err := http.Post(TOKEN_URL, "application/json", nil)
	if err != nil {
		println("an error occured while exchanging access_token with github,", err.Error())
		redirect(false)
		return
	}

	bodyBytes, err := io.ReadAll(tokenRes.Body)
	if err != nil {
		println("an error occured while exchanging access_token with github,", err.Error())
		redirect(false)
		return
	}

	formValues, err := url.ParseQuery(string(bodyBytes))
	if err != nil {
		println("an error occured while parsing form values,", err.Error())
		redirect(false)
		return
	}

	accessToken := formValues.Get("access_token")

	newReq, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		println("an error occured while creating request for users github profile,", err.Error())
		redirect(false)
		return
	}

	newReq.Header.Add("Authorization", "Bearer "+accessToken)

	client := &http.Client{}
	userDetailRes, err := client.Do(newReq)
	if err != nil {
		println("an error occured while requesting users github profile,", err.Error())
		redirect(false)
		return
	}

	var userDetails UserDetail
	if err := json.NewDecoder(userDetailRes.Body).Decode(&userDetails); err != nil {
		redirect(false)
		return
	}

	if userDetails.Email == nil {
		emailsReq, err := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
		if err != nil {
			println("an error occured while creating request to fetch users email from github,", err.Error())
			redirect(false)
			return
		}

		emailsReq.Header.Add("Authorization", "Bearer "+accessToken)
		emailsRes, err := client.Do(emailsReq)
		if err != nil {
			println("an error occured while fetching users email from github,", err.Error())
			redirect(false)
			return
		}

		var emails []EmailDetails
		if err := json.NewDecoder(emailsRes.Body).Decode(&emails); err != nil {
			redirect(false)
			return
		}

		for _, value := range emails {
			if value.Primary {
				userDetails.Email = &value.Email
				break
			}
		}
	}

	userId, err := database.GetUserId(*userDetails.Email)
	if err != nil {
		println("error occured while checking user in the database", err.Error())
		redirect(false)
		return
	} else if userId == 0 {
		if err := database.CreateUser(*userDetails.Email); err != nil {
			println("an error occured while creating user in the database,", err.Error())
			redirect(false)
			return
		}

		userId, err = database.GetUserId(*userDetails.Email)
		if err != nil {
			println("error occured while checking user in the database", err.Error())
			redirect(false)
			return
		}
	}

	sessionId, expires, err := database.CreateUserSession(userId)
	if err != nil {
		println("error occured while creating user session", err.Error())
		redirect(false)
		return
	}

	utils.SetCookie(w, "session", sessionId, expires)
	redirect(true)
}

func fetchProfile(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userId").(int64)
	profile, err := database.FetchProfile(userId)
	if err != nil {
		println("error occured while fetching user's profile,", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	utils.ToJSON(w, 200, profile)
}

func logout(w http.ResponseWriter, r *http.Request) {
	cookie, err := r.Cookie("session")
	if err != nil {
		utils.ToJSON(w, 400, nil)
		return
	}

	sessionId := cookie.Value
	if err := database.DestroySession(sessionId); err != nil {
		utils.ToJSON(w, 500, nil)
		return
	}
	cookie.MaxAge = -1
	http.SetCookie(w, cookie)

	utils.ToJSON(w, 200, nil)
}
