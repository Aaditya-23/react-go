package product_handler

import (
	"database/sql"
	"net/http"
	"strconv"

	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/utils"
	"github.com/go-chi/chi/v5"
)

func createProduct(w http.ResponseWriter, r *http.Request) {

	type ResBody struct {
		Name               string           `json:"name" validate:"required"`
		Description        string           `json:"description" validate:"required"`
		Price              *float64         `json:"price" validate:"required_with=DiscountPercentage"`
		DiscountPercentage float64          `json:"discountPercentage"`
		ImageKeys          []string         `json:"imageKeys"`
		Variants           []map[string]any `json:"variants" validate:"required_without=Price"`
	}

	var body ResBody

	if err := utils.DecodeJSON(r, &body); err != nil {
		println("error occured while decoding json", err.Error())
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid Request Body"})
		return
	}

	if err := utils.ValidateStruct(body); err != nil {
		println(err.Error())
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid Request Body"})
		return
	}

	if body.Price != nil {
		err := database.CreateProduct(database.NewProduct{
			Name:               body.Name,
			Description:        body.Description,
			Price:              *body.Price,
			DiscountPercentage: body.DiscountPercentage,
			ImageKeys:          body.ImageKeys})
		if err != nil {
			println("error occured while creating the product", err.Error())
			utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
			return
		}

		utils.ToJSON(w, 201, nil)
		return
	}

	if err := validateVariants(body.Variants); err != nil {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: err.Error()})
		return
	}

	if err := database.CreateProductWithVariants(database.NewProductWithVariants{
		Name:        body.Name,
		Description: body.Description,
		ImageKeys:   body.ImageKeys,
		Variants:    body.Variants,
	}); err != nil {
		println("error occured while creating a product with variants", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	utils.ToJSON(w, 201, "done")
}

func fetchProducts(w http.ResponseWriter, r *http.Request) {
	offsetParam := chi.URLParam(r, "offset")
	limitParam := chi.URLParam(r, "limit")

	offset, err := strconv.Atoi(offsetParam)
	if err != nil {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "invalid url params"})
		return
	}
	limit, err := strconv.Atoi(limitParam)
	if err != nil {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "invalid url params"})
		return
	}

	products, count, err := database.FetchProducts(offset, limit)
	if err != nil {
		println("error occured while fetching products", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	utils.ToJSON(w, 200, struct {
		Products []database.Product `json:"products"`
		Count    int64              `json:"count"`
	}{products, count})
}

func fetchProduct(w http.ResponseWriter, r *http.Request) {
	type Response struct {
		Product *database.Product `json:"product"`
	}

	idParam := chi.URLParam(r, "id")

	productId, err := strconv.Atoi(idParam)
	if err != nil {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "invalid url params"})
		return
	}

	product, err := database.FetchProduct(int64(productId))
	if err != nil {
		if err == sql.ErrNoRows {
			utils.ToJSON(w, 200, Response{nil})
			return
		}
		println("an error occured while fetching product from the database,", err.Error())
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	utils.ToJSON(w, 200, Response{Product: &product})
}

func deleteProduct(w http.ResponseWriter, r *http.Request) {
	type ResBody struct {
		ProductId int64 `json:"productId" validate:"required"`
	}

	var body ResBody
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.ToJSON(w, 400, nil)
		return
	}

	if err := database.DeleteProduct(body.ProductId); err != nil {
		println("an error occured while deleting the product,", err.Error())
		utils.ToJSON(w, 500, nil)
		return
	}

	utils.ToJSON(w, 200, nil)
}
