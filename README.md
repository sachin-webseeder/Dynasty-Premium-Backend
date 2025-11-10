
# Dynasty MVC Auth (Express + Mongoose + JWT)

## Features
- MVC-style structure (controllers, services, routes, models)
- Auth middleware (protect + role-based authorize)
- JWT authentication
- Password hashing with bcrypt
- Login using email or username

## Setup
1. Copy `.env.example` to `.env` and fill values
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run server:
   ```bash
   npm run dev
   ```

## Endpoints
- POST /api/auth/register
- POST /api/auth/login
- GET  /api/auth/me (protected)

Use Authorization header: `Bearer <token>`
