package product_handler

import (
	"database/sql"
	"errors"
	"net/http"
	"strconv"

	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/utils"
	v "github.com/aaditya-23/validator"
	"github.com/go-chi/chi/v5"
)

func createProduct(w http.ResponseWriter, r *http.Request) {

	type ResBody struct {
		Name               string   `json:"name"`
		Description        string   `json:"description"`
		Price              *float64 `json:"price"`
		DiscountPercentage *float64 `json:"discountPercentage"`
		// ImageKeys          []string         `json:"imageKeys"`
		Variants *[]map[string]any `json:"variants"`
	}

	var body ResBody

	if err := utils.DecodeJSON(r, &body); err != nil {
		println("error occured while decoding json", err.Error())
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid Request Body"})
		return
	}

	errs := v.Struct(&body).
		Fields(
			v.String(&body.Name, "name").Min(1),
			v.String(&body.Description, "description").Min(1),
			v.Number(body.Price, "price").Optional(),
			v.Number(body.DiscountPercentage, "discountPercentage").Optional(),
			v.Slice(body.Variants, "variants").Optional().Refine(func(variants []map[string]any) error {
				for _, v := range variants {
					price, ok := v["price"]
					if !ok {
						return errors.New("every variant must have a price")
					}
					_, ok = price.(float64)
					if !ok {
						return errors.New("price must be of type integer")
					}

					discountPercentage, ok := v["discountPercentage"]
					if ok {
						if _, ok := discountPercentage.(float64); !ok {
							return errors.New("discount percentage must be of type integer")
						}
					}

					for key, value := range v {
						if key == "price" || key == "discountPercentage" {
							continue
						}

						if _, ok := value.(string); !ok {
							return errors.New("value of variant-type must be of type string")
						}
					}
				}

				return nil
			}),
		).
		Refine(func(rb ResBody) error {
			if rb.Price == nil && rb.Variants == nil {
				return errors.New("price or variants is required")
			}

			return nil
		}).
		Parse()

	if len(errs) > 0 {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: errs[0].Message})
		return
	}

	if body.Price != nil {
		err := database.CreateProduct(database.NewProduct{
			Name:               body.Name,
			Description:        body.Description,
			Price:              *body.Price,
			DiscountPercentage: body.DiscountPercentage,
		})
		if err != nil {
			println("error occured while creating the product", err.Error())
			utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
			return
		}

		utils.ToJSON(w, 201, nil)
		return
	}

	if err := database.CreateProductWithVariants(database.NewProductWithVariants{
		Name:        body.Name,
		Description: body.Description,
		Variants:    *body.Variants,
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
		ProductId *int64 `json:"productId"`
	}

	var body ResBody
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.ToJSON(w, 400, nil)
		return
	}

	errs := v.Number(body.ProductId, "productId").Parse()
	if len(errs) > 0 {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: errs[0].Message})
		return
	}

	if err := database.DeleteProduct(*body.ProductId); err != nil {
		println("an error occured while deleting the product,", err.Error())
		utils.ToJSON(w, 500, nil)
		return
	}

	utils.ToJSON(w, 200, nil)
}
