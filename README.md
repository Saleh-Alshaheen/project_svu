# E-Commerce API v1

This is a comprehensive RESTful API for an e-commerce platform, built with Node.js, Express, and MongoDB.

## Base URL

All API endpoints are prefixed with `/api/v1`.
**Production URL:** `https://project-svu.onrender.com/api/v1`

---

## API Documentation

### Authentication

All protected routes require a Bearer Token in the `Authorization` header.

`Authorization: Bearer <YOUR_JWT_TOKEN>`

### Key Endpoints

| Endpoint        | HTTP Method | Description                                                               | Access |
| :-------------- | :---------- | :------------------------------------------------------------------------ | :----- |
| `/auth/signup`  | `POST`      | Register a new user.                                                      | Public |
| `/auth/login`   | `POST`      | Log in an existing user to get a JWT.                                     | Public |
| `/products`     | `GET`       | Get a list of all products. Supports filtering, sorting, pagination, etc. | Public |
| `/products/:id` | `GET`       | Get a single product by its ID.                                           | Public |
| `/cart`         | `POST`      | Add a product to the user's cart.                                         | User   |
| `/cart`         | `GET`       | Get the logged-in user's cart.                                            | User   |
| `/orders`       | `GET`       | Get all orders for the logged-in user.                                    | User   |

### Advanced Features

This API supports advanced querying on `GET` requests to collections like `/products`, `/categories`, etc.

- **Filtering:** `?price[gte]=100&ratingsAverage[gte]=4`
- **Sorting:** `?sort=-price,ratingsAverage`
- **Pagination:** `?page=2&limit=10`
- **Field Limiting:** `?fields=title,price,imageCover`
- **Keyword Search:** `?keyword=laptop`

Please refer to the source code for a full list of all available endpoints and their required parameters.
