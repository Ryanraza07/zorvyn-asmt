# Finance Data Processing and Access Control Backend

This project is a simple backend for a finance dashboard. It handles user management, role-based access control, transaction management, and dashboard summary data.

## Tech Stack

- Node.js
- Express.js
- MongoDB
- Mongoose
- JWT
- bcryptjs

## Features

- User registration and login
- JWT based authentication
- Role based access control
- User role and status management
- Create, read, update, and delete transactions
- Filter transactions by type, category, date range, and search
- Dashboard summary with:
  - total income
  - total expenses
  - net balance
  - category totals
  - recent activity
  - monthly trends

## Roles

- `admin`
  - can manage users
  - can create, update, and delete transactions
  - can view transactions and dashboard summary

- `analyst`
  - can view transactions
  - can view dashboard summary

- `viewer`
  - can only view dashboard summary

## Important Notes

- The first user who registers becomes `admin`
- Every next user is created as `viewer`
- Password must be at least 6 characters
- Protected routes require a JWT token in the `Authorization` header

Example:

```text
Authorization: Bearer your_token_here
```

## Project Structure

```text
Server/
  config/
    db.js
  controller/
    dashboard.controller.js
    transaction.controller.js
    user.controller.js
  middleware/
    auth.middleware.js
    error.middleware.js
    role.middleware.js
  models/
    transaction.model.js
    user.model.js
  routes/
    dashboard.routes.js
    transaction.routes.js
    user.routes.js
  utils/
    appError.js
    asyncHandler.js
    constants.js
    validation.js
  index.js
  package.json
```

## Setup

1. Go to the server folder

```bash
cd Server
```

2. Install dependencies

```bash
npm install
```

3. Create a `.env` file inside `Server/`

```env
PORT=8000
MONGO_URI=mongodb://127.0.0.1:27017/finance-dashboard
JWT_SECRET=your_secret_key
JWT_EXPIRES_IN=1d
NODE_ENV=development
```

4. Run the server

```bash
npm run dev
```

The server runs on:

```text
http://localhost:8000
```

## API Endpoints

### Public

#### `GET /`
- basic API response

#### `GET /health`
- health check

#### `POST /users/register`
- register a new user

Request body:

```json
{
  "name": "Altaf",
  "email": "altaf@gmail.com",
  "password": "123456"
}
```

#### `POST /users/login`
- login user

Request body:

```json
{
  "email": "altaf@gmail.com",
  "password": "123456"
}
```

### Authenticated

#### `GET /users/me`
- get logged-in user details

### Admin Only

#### `GET /users`
- get all users

Optional query params:
- `page`
- `limit`
- `role`
- `status`
- `search`

#### `GET /users/:id`
- get single user

#### `PATCH /users/:id/role`
- update user role

Request body:

```json
{
  "role": "analyst"
}
```

#### `PATCH /users/:id/status`
- update user active status

Request body:

```json
{
  "isActive": false
}
```

#### `DELETE /users/:id`
- delete user

#### `POST /transactions`
- create transaction

Request body:

```json
{
  "amount": 2500,
  "type": "income",
  "category": "Salary",
  "date": "2026-04-06",
  "notes": "Monthly salary"
}
```

#### `PATCH /transactions/:id`
- update transaction

Sample request body:

```json
{
  "amount": 1800,
  "category": "Food"
}
```

#### `DELETE /transactions/:id`
- delete transaction

### Admin and Analyst

#### `GET /transactions`
- get all transactions

Optional query params:
- `page`
- `limit`
- `type`
- `category`
- `startDate`
- `endDate`
- `search`

Example:

```text
/transactions?type=expense&category=Food&startDate=2026-04-01&endDate=2026-04-30
```

#### `GET /transactions/:id`
- get single transaction

### Admin, Analyst, Viewer

#### `GET /dashboard/summary`
- get dashboard summary

Optional query params:
- `type`
- `category`
- `startDate`
- `endDate`
- `search`

## Postman Tips

- Use `Content-Type: application/json`
- For protected routes add:

```text
Authorization: Bearer <token>
```

- First call:
  - `POST /users/register`
- Then:
  - `POST /users/login`
- Copy the token from login response
- Use that token for the protected APIs

## Response Codes

- `200` success
- `201` created
- `400` bad request
- `401` unauthorized
- `403` forbidden
- `404` not found
- `409` duplicate data

## Current Scope

This project is focused on backend logic and API handling. It does not include a frontend.
