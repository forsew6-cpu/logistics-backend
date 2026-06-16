# NearHub API Documentation

Base URL: `http://localhost:5000/api`

## Authentication

All protected endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <token>
```

---

## Auth Routes

### POST /auth/signup

Create a new user account.

**Body:**
```json
{ "name": "John Doe", "email": "john@example.com", "password": "secret123" }
```

**Response:** `201`
```json
{ "token": "jwt-token", "user": { "id": "...", "name": "...", "email": "...", "role": "user" } }
```

### POST /auth/login

Authenticate and receive a JWT token.

**Body:**
```json
{ "email": "john@example.com", "password": "secret123" }
```

**Response:** `200`
```json
{ "token": "jwt-token", "user": { "id": "...", "name": "...", "email": "...", "role": "user" } }
```

### GET /auth/me 🔒

Get current authenticated user.

**Response:** `200`
```json
{ "user": { "_id": "...", "name": "...", "email": "...", "role": "...", "bio": "..." } }
```

---

## User Routes

### PUT /users/profile 🔒

Update user profile.

**Body:**
```json
{ "name": "New Name", "bio": "My bio" }
```

### POST /users/profile/picture 🔒

Upload profile picture. Send as `multipart/form-data` with field `profilePicture`.

### PUT /users/change-password 🔒

**Body:**
```json
{ "currentPassword": "old", "newPassword": "new123" }
```

---

## Business Routes

### GET /businesses

List businesses with pagination and filters.

**Query params:** `page`, `limit`, `category`, `search`, `lng`, `lat`, `distance`, `sort`

**Response:** `200`
```json
{
  "businesses": [...],
  "pagination": { "page": 1, "limit": 20, "total": 50, "pages": 3 }
}
```

### GET /businesses/nearby

Find businesses near a location.

**Query params:** `lng` (required), `lat` (required), `distance` (meters, default 5000), `limit`

### GET /businesses/:id

Get a single business by ID.

### POST /businesses 🔒

Create a business listing. Send as `multipart/form-data`.

**Fields:** `name`, `category`, `description`, `contactPhone`, `contactEmail`, `website`, `address`, `longitude`, `latitude`, `openingHours` (JSON string), `images` (files, max 5)

### PUT /businesses/:id 🔒

Update a business (owner or admin only). Same fields as create.

### DELETE /businesses/:id 🔒

Delete a business (owner or admin only).

---

## Review Routes

### GET /reviews/business/:businessId

Get reviews for a business.

**Query params:** `page`, `limit`

### POST /reviews/business/:businessId 🔒

Create a review (one per user per business).

**Body:**
```json
{ "rating": 5, "comment": "Great place!" }
```

### PUT /reviews/:id 🔒

Update your review.

**Body:**
```json
{ "rating": 4, "comment": "Updated comment" }
```

### DELETE /reviews/:id 🔒

Delete your review (or admin can delete any).

---

## Favorite Routes

### GET /favorites 🔒

Get user's favorites list.

### POST /favorites/:businessId 🔒

Add a business to favorites.

### DELETE /favorites/:businessId 🔒

Remove a business from favorites.

### GET /favorites/check/:businessId 🔒

Check if a business is favorited.

**Response:** `200`
```json
{ "isFavorite": true }
```

---

## Admin Routes (Admin only) 🔒👑

### GET /admin/stats

Get platform statistics.

### GET /admin/users

List all users. **Query params:** `page`, `limit`, `search`

### PUT /admin/users/:id/role

Change user role.

**Body:**
```json
{ "role": "admin" }
```

### DELETE /admin/users/:id

Delete a user and their data.

### GET /admin/businesses

List all businesses (including inactive). **Query params:** `page`, `limit`, `search`, `category`

### PUT /admin/businesses/:id/toggle

Toggle business active/inactive status.

### DELETE /admin/reviews/:id

Delete any review.

---

## Error Responses

All errors follow this format:

```json
{ "message": "Error description" }
```

Validation errors:
```json
{ "message": "Validation failed", "errors": [{ "field": "email", "message": "Valid email is required" }] }
```

## Rate Limits

- General API: 100 requests per 15 minutes
- Auth endpoints: 20 requests per 15 minutes
