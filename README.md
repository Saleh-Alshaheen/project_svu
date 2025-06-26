# E-Commerce RESTful API

![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Node.js](https://img.shields.io/badge/Node.js-18.x-green.svg)
![Express.js](https://img.shields.io/badge/Express.js-4.x-blue.svg)
![MongoDB](https://img.shields.io/badge/MongoDB-6.x-brightgreen.svg)

A comprehensive, secure, and feature-rich RESTful API for a modern e-commerce platform. This project is built with Node.js, Express, and MongoDB, following professional design patterns and security best practices.

## Key Features

- **Complete Authentication:** JWT-based authentication (Login/Signup) with password hashing (bcrypt).
- **Role-Based Access Control:** Differentiated permissions for `user`, `manager`, and `admin` roles.
- **Full CRUD Operations:** For all major resources including Products, Categories, Subcategories, Brands, Users, Reviews, and Coupons.
- **Advanced API Features:** Server-side searching, filtering (by price, rating, etc.), sorting, pagination, and field limiting.
- **Nested Routing:** Cleanly implemented nested routes for subcategories within categories (`/categories/:id/subcategories`) and reviews within products (`/products/:id/reviews`).
- **Image Uploads & Processing:** Efficient handling of image uploads (for products, categories, etc.) with server-side resizing and optimization using `sharp`.
- **Shopping Cart & Wishlist:** Full-featured cart and wishlist functionality for users.
- **Order & Payment Flow:**
  - Complete order creation pipeline.
  - Inventory management (quantity is decremented upon order).
  - Secure online payments via **Stripe** integration.
  - Automated order fulfillment using **Stripe Webhooks**.
- **Robust Security Layers:** Includes rate limiting, protection against parameter pollution, NoSQL injection, Cross-Site Scripting (XSS), and security headers via `helmet`.

## Tech Stack

- **Backend:** Node.js, Express.js
- **Database:** MongoDB with Mongoose ODM
- **Authentication:** JSON Web Tokens (JWT)
- **Payments:** Stripe API
- **Image Processing:** Sharp
- **Security:** Helmet, Express Rate Limit, HPP, Express Mongo Sanitize, XSS
- **Validation:** Express Validator

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18.x or later recommended)
- [MongoDB](https://www.mongodb.com/try/download/community) installed and running locally, or a connection string from a service like MongoDB Atlas.

### Installation

1.  **Clone the repository:**

    ```bash
    git clone [https://github.com/Saleh-Alshaheen/project_svu.git](https://github.com/Saleh-Alshaheen/project_svu.git)
    cd project_svu
    ```

2.  **Install NPM packages:**

    ```bash
    npm install
    ```

3.  **Create an Environment File:**
    Create a file named `config.env` in the root directory and add the necessary environment variables. You can use the example below as a template.

### Environment Variables

Create a `config.env` file and populate it with the following keys.

Application Settings
NODE_ENV=development
PORT=8000
BASE_URL=http://localhost:8000

Database
DB_URI=mongodb://127.0.0.1:27017/ecommerce-api

JWT Secrets
JWT_SECRET_KEY=your_super_strong_jwt_secret_key_here
JWT_EXPIRE_TIME=30d

Stripe Secrets
STRIPE*SECRET=sk_test*...
STRIPE*WEBHOOK_SECRET=whsec*...

Email Service (using Mailtrap.io for example)
EMAIL_HOST=sandbox.smtp.mailtrap.io
EMAIL_PORT=2525
EMAIL_USER=your_mailtrap_user
EMAIL_PASSWORD=your_mailtrap_password
EMAIL_FROM="E-Shop" <youremail@example.com>

### Running the Application

1.  **Start the server:**

    ```bash
    npm run start:dev
    ```

    The server will start on the port specified in your `config.env` file (e.g., `http://localhost:8000`).

2.  **Database Seeding (Optional):**
    The project includes a seeder script to populate the database with sample product data.
    - **To insert data:** `node utils/Data/script.js -i`
    - **To destroy data:** `node utils/Data/script.js -d`

---

## API Endpoint Documentation

The API base URL is `/api/v1`.

### Authentication

| Endpoint               | Method | Description                 | Access |
| :--------------------- | :----- | :-------------------------- | :----- |
| `/auth/signup`         | `POST` | Register a new user.        | Public |
| `/auth/login`          | `POST` | Log in to get a JWT.        | Public |
| `/auth/forgotPassword` | `POST` | Send a password reset code. | Public |

### Products

| Endpoint        | Method   | Description                                             | Access        |
| :-------------- | :------- | :------------------------------------------------------ | :------------ |
| `/products`     | `GET`    | Get a list of all products. Supports advanced querying. | Public        |
| `/products`     | `POST`   | Create a new product.                                   | Admin/Manager |
| `/products/:id` | `GET`    | Get a single product by its ID.                         | Public        |
| `/products/:id` | `PUT`    | Update a product.                                       | Admin/Manager |
| `/products/:id` | `DELETE` | Delete a product.                                       | Admin         |

**Advanced Product Queries (`GET /api/v1/products`)**

You can use the following query parameters to control the response:

- **Filtering:** `?price[gte]=100&ratingsAverage[gte]=4`
- **Sorting:** `?sort=-price,ratingsAverage`
- **Pagination:** `?page=2&limit=10`
- **Field Limiting:** `?fields=title,price,imageCover`
- **Keyword Search:** `?keyword=laptop`

### Cart

| Endpoint            | Method   | Description                           | Access |
| :------------------ | :------- | :------------------------------------ | :----- |
| `/cart`             | `GET`    | Get the logged-in user's cart.        | User   |
| `/cart`             | `POST`   | Add a product to the cart.            | User   |
| `/cart`             | `DELETE` | Clear the entire cart.                | User   |
| `/cart/:itemId`     | `DELETE` | Remove a specific item from the cart. | User   |
| `/cart/applyCoupon` | `PUT`    | Apply a coupon to the cart.           | User   |

---

## Security Features

This API includes multiple layers of security to ensure data integrity and protect against common vulnerabilities.

- **`helmet`**: Sets various important HTTP security headers.
- **`express-rate-limit`**: Protects against brute-force attacks by limiting repeated requests.
- **`hpp`**: Protects against HTTP Parameter Pollution attacks.
- **`express-mongo-sanitize`**: Sanitizes incoming data to prevent NoSQL query injection.
- **`xss`**: Sanitizes user input to prevent Cross-Site Scripting (XSS) attacks.
- **JWT Authentication**: All sensitive endpoints are protected and require a valid JSON Web Token.
- **Role-Based Authorization**: Endpoints are restricted based on user roles (`user`, `manager`, `admin`).
