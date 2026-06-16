# NearHub

Discover nearby businesses, services, events, and opportunities on an interactive map. NearHub is a modern, mobile-friendly, full-stack web application.

## Tech Stack

- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB Atlas with Mongoose
- **Authentication:** JWT with bcrypt password hashing
- **Maps:** OpenStreetMap + Leaflet + React Leaflet

## Features

- User accounts (signup, login, profile editing, profile picture upload)
- Interactive OpenStreetMap map with business markers
- Business listings with CRUD operations
- Search & filter by name, category, distance
- Reviews & star ratings
- Favorites (save/unsave businesses)
- Admin dashboard (user management, listing moderation, statistics)
- Responsive design (desktop, tablet, mobile)
- Security (rate limiting, input validation, JWT protection)
- API pagination and lazy loading

## Project Structure

```
nearhub/
├── backend/
│   ├── src/
│   │   ├── config/          # Database configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── middleware/       # Auth, upload, rate limiting, validation
│   │   ├── models/          # Mongoose schemas (User, Business, Review, Favorite)
│   │   ├── routes/          # Express routes
│   │   ├── utils/           # Helper functions
│   │   ├── server.js        # Express app entry point
│   │   └── seed.js          # Sample data seeder
│   ├── uploads/             # Uploaded images
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── app/             # Next.js App Router pages
│   │   ├── components/      # Reusable React components
│   │   ├── contexts/        # Auth context provider
│   │   ├── lib/             # API client
│   │   └── types/           # TypeScript type definitions
│   └── package.json
├── .env.example
├── API.md                   # API documentation
└── README.md
```

## Getting Started

### Prerequisites

- Node.js 18+
- MongoDB Atlas account (or local MongoDB)

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/forsew6-cpu/logistics-backend.git nearhub
cd nearhub
```

2. **Set up environment variables**

```bash
# Backend
cp backend/.env.example backend/.env
# Edit backend/.env with your MongoDB URI and JWT secret

# Frontend
cp frontend/.env.example frontend/.env.local
# Edit frontend/.env.local with your API URL
```

3. **Install dependencies**

```bash
# Backend
cd backend
npm install

# Frontend
cd ../frontend
npm install
```

4. **Seed sample data**

```bash
cd backend
npm run seed
```

5. **Start development servers**

```bash
# Terminal 1 - Backend (port 5000)
cd backend
npm run dev

# Terminal 2 - Frontend (port 3000)
cd frontend
npm run dev
```

6. **Open the app**

Visit [http://localhost:3000](http://localhost:3000)

### Test Accounts (after seeding)

| Role  | Email              | Password    |
|-------|--------------------|-------------|
| Admin | admin@nearhub.com  | password123 |
| User  | jane@example.com   | password123 |
| User  | bob@example.com    | password123 |

## Environment Variables

| Variable                  | Description                          | Required |
|---------------------------|--------------------------------------|----------|
| `MONGODB_URI`             | MongoDB connection string            | Yes      |
| `JWT_SECRET`              | Secret key for JWT signing           | Yes      |
| `PORT`                    | Backend server port (default: 5000)  | No       |
| `NEXT_PUBLIC_API_URL`     | Backend API URL                      | Yes      |

## License

MIT
