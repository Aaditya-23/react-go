-- +goose Up
CREATE TABLE users(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255),
    email VARCHAR(255) UNIQUE NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE products(
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price FLOAT,
    discount_percentage FLOAT,
    variants JSON NOT NULL DEFAULT ('[]'),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE magic_tokens(
    id SERIAL PRIMARY KEY,
    token TEXT NOT NULL,
    user_id INT NOT NULL REFERENCES users(id),
    is_verified BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE sessions(
    id VARCHAR(255) NOT NULL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id),
    expires TIMESTAMP NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE carts (
    id SERIAL PRIMARY KEY,
    user_id INT UNIQUE NOT NULL REFERENCES users(id)
);

CREATE TABLE cart_items(
    id SERIAL PRIMARY KEY,
    cart_id INT NOT NULL REFERENCES carts(id),
    product_id INT NOT NULL REFERENCES products(id),
    variant JSON,
    quantity INT NOT NULL
);

-- +goose Down
DROP TABLE magic_tokens;

DROP TABLE sessions;

DROP TABLE cart_items;

DROP TABLE carts;

DROP TABLE products;

DROP TABLE users;