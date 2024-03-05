package database

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
)

type ProductDetail struct {
	Id                 int64              `json:"id"`
	Name               string             `json:"name"`
	Price              *float64           `json:"price"`
	DiscountPercentage *float64           `json:"discountPercentage"`
	Quantity           int                `json:"quantity"`
	Variant            *map[string]string `json:"variant"`
}

type CartDetails struct {
	Id       int64           `json:"id"`
	Products []ProductDetail `json:"products"`
}

func GetCartId(userId int64) (int64, error) {
	const query = `SELECT id from carts WHERE user_id = ?`

	var cartId int64
	err := db.QueryRow(query, userId).Scan(&cartId)

	return cartId, err
}

func CreateCart(userId int64) (int64, error) {
	const query = `INSERT INTO carts (user_id) VALUES (?)`
	var cartId int64

	result, err := db.Exec(query, userId)
	if err != nil {
		return cartId, err
	}

	cartId, err = result.LastInsertId()

	return cartId, err
}

func GetCartDetails(cartId int64) (CartDetails, error) {
	const query = `SELECT T1.quantity, T1.variant, T2.name, T2.price, T2.discount_percentage, T2.id as product_id, T2.variants as product_variants
	FROM cart_items as T1
	JOIN products as T2
	ON T1.product_id = T2.id
	WHERE cart_id = ?`

	var cartDetails CartDetails
	cartDetails.Id = cartId

	rows, err := db.Query(query, cartId)
	if err != nil {
		return cartDetails, err
	}

	for rows.Next() {
		var product ProductDetail
		var selectedVariantBytes *[]byte
		var productVariantsBytes []byte

		err := rows.Scan(&product.Quantity, &selectedVariantBytes, &product.Name, &product.Price, &product.DiscountPercentage, &product.Id, &productVariantsBytes)
		if err != nil {
			return cartDetails, err
		}

		if selectedVariantBytes != nil {
			if err := json.Unmarshal(*selectedVariantBytes, &product.Variant); err != nil {
				return cartDetails, err
			}
		} else {
			cartDetails.Products = append(cartDetails.Products, product)
			continue
		}

		var productVariants []map[string]any
		if err := json.Unmarshal(productVariantsBytes, &productVariants); err != nil {
			return cartDetails, err
		}

	Outer:
		for _, variant := range productVariants {
			for key, value := range *product.Variant {
				variantValue, ok := variant[key]
				if !ok {
					return cartDetails, errors.New("invalid variant found")
				}

				if variantValue != value {
					continue Outer
				}
			}

			price, ok := variant["price"]
			if !ok {
				return cartDetails, errors.New("price missing from variant")
			}
			convertedPrice, ok := price.(float64)
			if !ok {
				return cartDetails, errors.New("incorrect price value")
			}
			product.Price = &convertedPrice

			discountPercentage, ok := variant["discountPercentage"]
			if ok {
				convertedDiscountPercentage, ok := discountPercentage.(float64)
				if !ok {
					return cartDetails, errors.New("incorrect discount percentage value")
				}
				product.DiscountPercentage = &convertedDiscountPercentage
			}
			break
		}

		cartDetails.Products = append(cartDetails.Products, product)
	}

	return cartDetails, err
}

func CheckProductVariants(cartId, productId int64) (int64, bool, error) {
	const query = `SELECT T1.id, variants FROM cart_items AS T1 JOIN products AS T2 ON product_id = T2.id WHERE cart_id = ? AND product_id = ?`

	var (
		variantBytes []byte
		variants     []map[string]any
		cartItemId   int64
	)

	if err := db.QueryRow(query, cartId, productId).Scan(&cartItemId, &variantBytes); err != nil {
		return cartItemId, false, err
	}

	if err := json.Unmarshal(variantBytes, &variants); err != nil {
		return cartItemId, false, err
	}

	if len(variants) > 0 {
		return cartItemId, true, nil
	}

	return cartItemId, false, nil
}

func AddVariantProductToCart(cartId, productId int64, variant map[string]string) error {
	query := `SELECT T1.id FROM cart_items AS T1 JOIN products AS T2 ON product_id = T2.id WHERE cart_id = ? AND product_id = ? AND JSON_CONTAINS(variant, JSON_OBJECT(`

	for key, value := range variant {
		query += fmt.Sprintf("'%s', '%s',", key, value)
	}
	query, _ = strings.CutSuffix(query, ",")
	query += "))"

	var cartItemId int64
	err := db.QueryRow(query, cartId, productId).Scan(&cartItemId)
	if err == sql.ErrNoRows {
		const insertQuery = `INSERT INTO cart_items (cart_id, product_id, variant, quantity) VALUES (?, ?, ?, ?)`

		variantBytes, err := json.Marshal(variant)
		if err != nil {
			return err
		}

		_, err = db.Exec(insertQuery, cartId, productId, string(variantBytes), 1)

		return err
	} else if err != nil {
		return err
	} else {
		err = IncrementProductQuantityInCart(cartItemId)
		return err
	}
}

func IncrementProductQuantityInCart(cartItemId int64) error {
	const query = `UPDATE cart_items SET quantity = quantity + 1 WHERE id = ?`

	_, err := db.Exec(query, cartItemId)
	return err
}

func AddNewProductToCart(cartId, productId int64, variant map[string]string) error {
	query := `INSERT INTO cart_items (cart_id, product_id, quantity`

	if len(variant) > 0 {
		query += ", variant"
	}

	query += ") VALUES (?, ?, ?"

	if len(variant) > 0 {
		query += ", ?"
	}

	query += ")"

	variantBytes, err := json.Marshal(variant)
	if err != nil {
		return err
	}

	if len(variant) > 0 {
		_, err = db.Exec(query, cartId, productId, 1, string(variantBytes))
	} else {
		_, err = db.Exec(query, cartId, productId, 1)
	}

	return err
}

func DeleteVariantProductFromCart(cartId, productId int64, variant map[string]string) error {
	query := `SELECT id, quantity FROM cart_items WHERE cart_id = ? AND product_id = ? AND JSON_CONTAINS(variant, JSON_OBJECT(`

	for key, value := range variant {
		query += fmt.Sprintf("'%s', '%s',", key, value)
	}
	query, _ = strings.CutSuffix(query, ",")
	query += "))"

	var (
		cartItemId int64
		quantity   int64
	)

	err := db.QueryRow(query, cartId, productId).Scan(&cartItemId, &quantity)
	if err != nil {
		return err
	}

	if quantity <= 1 {
		if err := RemoveProductFromCart(cartItemId); err != nil {
			return err
		}
	} else {
		if err := DecrementProductFromCart(cartItemId); err != nil {
			return err
		}
	}

	return nil
}

func DeleteProductFromCart(cartItemId int64) error {
	const query = `SELECT quantity from cart_items WHERE id = ?`
	var quantity int64

	err := db.QueryRow(query, cartItemId).Scan(&quantity)
	if err != nil {
		return err
	}

	if quantity <= 1 {
		if err := RemoveProductFromCart(cartItemId); err != nil {
			return err
		}
	} else {
		if err := DecrementProductFromCart(cartItemId); err != nil {
			return err
		}
	}

	return nil
}

func RemoveProductFromCart(cartItemId int64) error {
	const query = `DELETE FROM cart_items WHERE id = ?`
	_, err := db.Exec(query, cartItemId)

	return err
}

func DecrementProductFromCart(cartItemId int64) error {
	const query = `UPDATE cart_items SET quantity = quantity - 1 WHERE id = ?`
	_, err := db.Exec(query, cartItemId)

	return err
}

func Order(cartId int64) error {
	const query = `DELETE FROM carts WHERE id = ?`
	_, err := db.Exec(query, cartId)

	return err
}
