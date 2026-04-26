# MnM Cubes - Speedcube Shop Inventory

A mobile-first product catalog and stock management system for a speedcube shop in the Philippines. Designed to reduce repetitive buyer messages ("HM?", "Available?") by showing updated prices and live stock, while making it easy for customers to order through Facebook Messenger.

## 🏗️ Architecture

```
MnM-Inventory/
├── backend/                  # Express.js REST API
│   ├── src/
│   │   ├── config/          # Environment configuration
│   │   ├── controllers/     # Route handlers
│   │   ├── db/              # Database pool, setup, seed
│   │   ├── middleware/      # Auth, error handling, uploads
│   │   ├── routes/          # API route definitions
│   │   └── server.js        # Express app entry point
│   ├── uploads/             # File uploads directory
│   ├── .env.example         # Environment template
│   └── package.json
├── frontend/                 # React + Vite SPA
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable UI components
│   │   │   ├── layouts/     # Page layouts
│   │   │   ├── store/       # Customer-facing components
│   │   │   └── ui/          # Shared UI elements
│   │   ├── context/         # React context (auth)
│   │   ├── lib/             # API client, utilities
│   │   ├── pages/           # Page components
│   │   │   └── admin/       # Admin dashboard pages
│   │   ├── App.jsx          # Router setup
│   │   └── main.jsx         # Entry point
│   ├── .env.example         # Environment template
│   └── package.json
├── DEPLOYMENT.md            # VPS deployment guide
├── CONVERSION_TIPS.md       # Business conversion tips
└── README.md                # This file
```

## 🚀 Quick Start (Local Development)

### Prerequisites

- **Node.js** 18+ and npm
- **PostgreSQL** 14+
- A terminal / command line

### 1. Clone and install dependencies

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
```

### 2. Set up the database

```bash
# Create the PostgreSQL database
sudo -u postgres psql -c "CREATE DATABASE mnm_inventory;"

# Or if you're using your own user:
createdb mnm_inventory
```

### 3. Configure environment variables

```bash
# Backend
cd backend
cp .env.example .env
# Edit .env with your database credentials and settings

# Frontend
cd ../frontend
cp .env.example .env
# Edit .env with your Messenger page ID
```

**Backend `.env` key settings:**
```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=mnm_inventory
DB_USER=postgres
DB_PASSWORD=your_password
JWT_SECRET=change_this_to_a_random_string
MESSENGER_PAGE_ID=your_facebook_page_id
FRONTEND_URL=http://localhost:5173

# Cloudinary (free account: https://cloudinary.com)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
CLOUDINARY_FOLDER=mnm-cubes
```

### 4. Set up database tables and seed data

```bash
cd backend
npm run db:setup    # Creates tables
npm run db:seed     # Seeds categories + sample products + admin user
```

### 5. Start development servers

```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

### 6. Access the app

- **Customer storefront:** http://localhost:5173
- **Admin dashboard:** http://localhost:5173/admin
- **API health check:** http://localhost:5000/api/health

### Default admin credentials:
- **Email:** admin@mnmcubes.ph
- **Password:** admin123
- ⚠️ **Change this after first login!**

## 📡 API Endpoints

### Public Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/products` | List products (with filters) |
| GET | `/api/products/:slug` | Get product by slug |
| GET | `/api/categories` | List active categories |
| GET | `/api/categories/:id` | Get category by ID |
| GET | `/api/config/messenger` | Get Messenger config |

### Auth Endpoints
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/login` | Admin login |
| GET | `/api/auth/me` | Get current admin profile |
| PUT | `/api/auth/password` | Change password |

### Admin Endpoints (requires JWT)
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/products` | Create product |
| PUT | `/api/products/:id` | Update product |
| PATCH | `/api/products/:id/stock` | Quick stock update |
| DELETE | `/api/products/:id` | Delete product |
| GET | `/api/products/admin/low-stock` | Low stock products |
| GET | `/api/products/admin/stats` | Product statistics |
| POST | `/api/products/import` | Import from CSV/Excel |
| POST | `/api/categories` | Create category |
| PUT | `/api/categories/:id` | Update category |
| DELETE | `/api/categories/:id` | Delete category |

### Product Query Parameters
| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `category` | string | - | Filter by category slug or ID |
| `search` | string | - | Search by name or description |
| `sort` | string | `name` | Sort by: name, price, stock, newest, category |
| `order` | string | `asc` | Sort order: asc, desc |
| `page` | number | 1 | Page number |
| `limit` | number | 50 | Items per page (max 100) |
| `active_only` | string | `true` | Show only active products |

## 🔧 Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18, Vite, Tailwind CSS |
| Backend | Node.js, Express.js |
| Database | PostgreSQL |
| Auth | JWT + bcrypt |
| Image Hosting | Cloudinary (free tier) |
| File Import | xlsx (SheetJS) |
| Deployment | PM2 + Nginx |

## 📱 Features

### Customer Features
- Mobile-first responsive storefront
- Product grid with images, prices, stock status
- Category filter pills
- Search bar with debounced input
- Sort options (name, price, newest, category)
- Product detail modal
- "Message to Order" button (opens Messenger)
- Prefilled order message

### Admin Features
- Secure JWT-based login
- Dashboard with stats and low-stock alerts
- Full product CRUD (create, read, update, delete)
- Quick inline stock editing
- Toggle product visibility
- Category management
- CSV/Excel bulk import
- Inventory value tracking

## 📦 CSV Import Format

| Column | Required | Example |
|--------|----------|---------|
| name | Yes | MoYu RS3M 2024 |
| category | No | 3x3 |
| price | Yes | 450 |
| stock | No | 25 |
| description | No | Budget-friendly magnetic 3x3 |

## 🔮 Future Expansion Ideas

- [x] Image upload (Cloudinary)
- [ ] Multiple admin accounts
- [ ] Order request tracking
- [ ] Audit logs
- [ ] Customer inquiry tracking
- [ ] Analytics dashboard
- [ ] Promo banners
- [ ] WhatsApp/Viber ordering
- [ ] Product variants (colors, versions)
- [ ] Bulk price updates

## 📄 License

Private project. All rights reserved.
