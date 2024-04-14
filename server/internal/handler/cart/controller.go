package cart_handler

import (
	"database/sql"
	"net/http"

	"github.com/Aaditya-23/server/internal/database"
	"github.com/Aaditya-23/server/internal/utils"
	v "github.com/aaditya-23/validator"
)

func fetchCart(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userId").(int64)

	cartId, err := database.GetCartId(userId)
	if err != nil {
		if err == sql.ErrNoRows {
			cartId, err = database.CreateCart(userId)
			if err != nil {
				println("an error occured while creating cart,", err.Error())
				utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
			}
		} else {

			utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
			return
		}
	}

	data, err := database.GetCartDetails(cartId)
	if err != nil {
		println(err.Error())
	}

	utils.ToJSON(w, 200, data)
}

func updateCart(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userId").(int64)

	type ResBody struct {
		Type      *string            `json:"type"`
		ProductId *int64             `json:"productId"`
		Variant   *map[string]string `json:"variant"`
	}

	var body ResBody
	if err := utils.DecodeJSON(r, &body); err != nil {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: "Bad request"})
		return
	}

	errs := v.Struct(&body).
		Fields(
			v.String(body.Type, "type").IsOneOf([]string{"add", "remove"}),
			v.Number(body.ProductId, "productId").Min(1),
			v.Map(body.Variant, "variant").Optional(),
		).
		Parse()

	if len(errs) > 0 {
		utils.ToJSON(w, 400, utils.ErrResponse{Error: errs[0].Message})
		return
	}

	cartId, err := database.GetCartId(userId)
	if err != nil {
		utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
		return
	}

	if *body.Type == "add" {
		cartItemId, hasVariants, err := database.CheckProductVariants(cartId, *body.ProductId)
		if err == sql.ErrNoRows {
			containVariants, err := database.ProductHasVariants(*body.ProductId)
			if err != nil {
				println("error occured while checking if the product has variants,", err.Error())
				utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
				return
			}

			if containVariants {
				if body.Variant == nil {
					utils.ToJSON(w, 400, nil)
					return
				}

				if err := database.AddNewProductToCart(cartId, *body.ProductId, *body.Variant); err != nil {
					println("an error occured while adding new product to the cart,", err.Error())
					utils.ToJSON(w, 500, nil)
					return
				}
			} else {
				if err := database.AddNewProductToCart(cartId, *body.ProductId, nil); err != nil {
					println("an error occured while adding new product to the cart,", err.Error())
					utils.ToJSON(w, 500, nil)
					return
				}
			}
		} else if err != nil {
			println("an error occured while updating cart details", err.Error())
			utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
			return
		}

		if hasVariants {
			if body.Variant == nil {
				utils.ToJSON(w, 400, utils.ErrResponse{Error: "Invalid request"})
				return
			}

			if err := database.AddVariantProductToCart(cartId, *body.ProductId, *body.Variant); err != nil {
				utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
				return
			}
		} else {
			err := database.IncrementProductQuantityInCart(cartItemId)
			if err != nil {
				utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
				return
			}
		}
	} else {
		cartItemId, hasVariants, err := database.CheckProductVariants(cartId, *body.ProductId)
		if err == sql.ErrNoRows {
			utils.ToJSON(w, 400, nil)
			return
		} else if err != nil {
			println("an error occured while checking proudct variants,", err.Error())
			utils.ToJSON(w, 500, nil)
			return
		}

		if hasVariants {
			if body.Variant == nil {
				utils.ToJSON(w, 400, nil)
				return
			}

			if err := database.DeleteVariantProductFromCart(cartId, *body.ProductId, *body.Variant); err != nil {
				println("an error occured while deleting product from cart,", err.Error())
				utils.ToJSON(w, 500, nil)
				return
			}
		} else {
			if err := database.DeleteProductFromCart(cartItemId); err != nil {
				println("error occured while deleting product from the cart,", err.Error())
				utils.ToJSON(w, 500, utils.ErrResponse{Error: "Internal Server Error"})
				return
			}
		}
	}

	utils.ToJSON(w, 201, nil)
}

func order(w http.ResponseWriter, r *http.Request) {
	userId := r.Context().Value("userId").(int64)
	cartId, err := database.GetCartId(userId)
	if err != nil {
		println("an error occured while placing order,", err.Error())
		utils.ToJSON(w, 500, nil)
		return
	}

	if err := database.Order(cartId); err != nil {
		println("an error occured while placing order,", err.Error())
		utils.ToJSON(w, 500, nil)
		return
	}

	utils.ToJSON(w, 200, nil)
}
