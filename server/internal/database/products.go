package database

import (
	"encoding/json"
	"fmt"
)

type NewProduct struct {
	Name               string
	Description        string
	Price              float64
	DiscountPercentage *float64
}

type NewProductWithVariants struct {
	Name        string
	Description string
	ImageKeys   []string
	Variants    []map[string]any
}

type Product struct {
	Id                 int64            `json:"id"`
	Name               string           `json:"name"`
	Description        *string          `json:"description"`
	Price              *int64           `json:"price"`
	DiscountPercentage *int64           `json:"discountPercentage"`
	ImageKeys          []string         `json:"imageKeys"`
	Variants           []map[string]any `json:"variants"`
}

func CreateProduct(product NewProduct) error {
	cols := []string{"name", "description", "price"}
	values := []any{product.Name, product.Description, product.Price}

	if product.DiscountPercentage != nil {
		cols = append(cols, "discount_percentage")
		values = append(values, *product.DiscountPercentage)
	}

	query := `INSERT INTO products (`
	for i, col := range cols {
		if i < len(cols)-1 {
			query += fmt.Sprintf("%s, ", col)
		} else {
			query += fmt.Sprintf("%s) ", col)
		}
	}

	query += "VALUES ("
	for i := 0; i < len(values); i++ {
		if i == len(values)-1 {
			query += "?)"
		} else {
			query += "?, "
		}
	}

	query += ";"
	_, err := db.Exec(query, values...)

	return err
}

func CreateProductWithVariants(product NewProductWithVariants) error {
	const query = `INSERT INTO products (name, description, variants) VALUES (?, ?, ?)`

	variantsJSON, err := json.Marshal(product.Variants)
	if err != nil {
		return err
	}

	_, err = db.Exec(query, product.Name, product.Description, string(variantsJSON))
	return err
}

func FetchProducts(offset, limit int) ([]Product, int64, error) {
	const query = `SELECT id, name, description, price, discount_percentage, variants FROM products ORDER BY updated_at DESC LIMIT ? OFFSET ?`
	products := []Product{}

	rows, err := db.Query(query, limit, offset)
	if err != nil {
		return products, 0, err
	}
	defer rows.Close()

	for rows.Next() {
		var product Product
		var variants []byte
		if err := rows.Scan(&product.Id, &product.Name, &product.Description, &product.Price, &product.DiscountPercentage, &variants); err != nil {
			return products, 0, err
		}

		if err := json.Unmarshal(variants, &product.Variants); err != nil {
			return products, 0, err
		}

		products = append(products, product)
	}
	count, err := ProductsCount()

	return products, count, nil
}

func FetchProduct(id int64) (Product, error) {
	const query = `SELECT id, name, description, price, discount_percentage, variants FROM products WHERE id = ?`

	var product Product
	var variants []byte

	err := db.QueryRow(query, id).Scan(&product.Id, &product.Name, &product.Description, &product.Price, &product.DiscountPercentage, &variants)
	if err != nil {
		return product, err
	}

	err = json.Unmarshal(variants, &product.Variants)
	return product, err
}

func ProductHasVariants(id int64) (bool, error) {
	const query = `SELECT JSON_LENGTH(variants) AS length FROM products WHERE id = ?`

	var length int64

	err := db.QueryRow(query, id).Scan(&length)
	if err != nil {
		return false, err
	}

	if length > 0 {
		return true, err
	}

	return false, err
}

func DeleteProduct(productId int64) error {
	const query = `DELETE FROM products WHERE id = ?`

	_, err := db.Exec(query, productId)
	return err
}

func ProductsCount() (int64, error) {
	const query = `SELECT COUNT(*) FROM products`
	var count int64
	err := db.QueryRow(query).Scan(&count)

	return count, err
}
