package product_handler

import "errors"

func validateVariants(variants []map[string]any) error {
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
}
