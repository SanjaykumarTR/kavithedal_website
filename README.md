# Kavithedal Publications

A professional e-commerce publication platform for Tamil literary works, built with Django REST API backend and React frontend.

![Django](https://img.shields.io/badge/Django-5.1-green)
![React](https://img.shields.io/badge/React-19-blue)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16+-blue)

## 📁 Project Structure

```
kavithedal-publications/
├── frontend/               # React + Vite frontend
│   ├── src/
│   │   ├── api/            # API utilities
│   │   ├── components/     # React components
│   │   ├── context/       # React contexts
│   │   ├── data/          # Static data
│   │   ├── pages/          # Page components
│   │   └── styles/        # CSS files
│   ├── package.json
│   └── vite.config.js
│
├── backend/               # Django REST API backend
│   ├── apps/
│   │   ├── accounts/      # User authentication & management
│   │   ├── authors/       # Author management
│   │   ├── books/         # Book catalog & management
│   │   ├── orders/        # Order & payment processing
│   │   ├── contests/     # Writing contests
│   │   └── testimonials/ # Customer testimonials
│   ├── config/            # Django settings
│   ├── manage.py
│   └── requirements.txt
│
├── render.yaml            # Render deployment blueprint
└── README.md              # This file
```

## 🚀 Quick Start

### Prerequisites

- Python 3.13+
- Node.js 18+
- PostgreSQL (for production)

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# Linux/Mac:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
copy .env.example .env
# Edit .env with your settings

# Run migrations
python manage.py migrate

# Create admin user
python manage.py createadmin

# Start development server
python manage.py runserver
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
copy .env.example .env
# Edit .env with your API URL

# Start development server
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)

```env
SECRET_KEY=your-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
DATABASE_URL=postgres://user:password@host:5432/dbname
CASHFREE_ENV=production
PAYU_ENV=xxx
PAYU_SALT=xxx
CLOUDINARY_CLOUD_NAME=xxx
CLOUDINARY_API_KEY=xxx
CLOUDINARY_API_SECRET=xxx
```

### Frontend (.env)

```env
VITE_API_URL=http://localhost:8000
VITE_RAZORPAY_KEY_ID=rzp_test_xxx
```

## 📦 Features

### User Features
- 📚 Browse books by category/author
- 🔍 Search and filter books
- ❤️ Add to wishlist
- 🛒 Shopping cart
- 📖 Read eBooks online
- 🏆 Participate in writing contests
- 📝 Submit manuscripts

### Admin Features
- 📖 Manage book catalog
- 👤 Manage authors
- 📦 Process orders
- 💰 Manage payments
- 📊 Dashboard analytics
- 🎯 Manage contests

## 🛠️ Technology Stack

### Backend
- Django 5.1
- Django REST Framework
- PostgreSQL
- JWT Authentication
- Razorpay Payment Gateway
- Cloudinary (media storage)

### Frontend
- React 19
- Vite
- React Router
- Axios
- Swiper (slider)

## 🚀 Deployment

This project is configured for deployment on [Render](https://render.com). See `render.yaml` for automatic deployment configuration.

### Manual Deploy

1. **Backend (Web Service)**
   - Root directory: `backend`
   - Build command: `pip install -r requirements.txt`
   - Start command: `gunicorn config.wsgi:application --bind 0.0.0.0:$PORT`

2. **Frontend (Static Site)**
   - Root directory: `frontend`
   - Build command: `npm install && npm run build`
   - Publish directory: `dist`

## 📄 API Endpoints

| Endpoint | Description |
|----------|-------------|
| `/api/register/` | User registration |
| `/api/login/` | User login |
| `/api/books/` | Book listing |
| `/api/authors/` | Author listing |
| `/api/orders/create-order/` | Create order |
| `/api/orders/verify-payment/` | Verify payment |
| `/api/orders/library/` | User library |

## 🔐 Security

- JWT token authentication
- OTP verification for admin login
- CSRF protection
- Rate limiting
- Secure password hashing
- Environment variables for secrets

## 📝 License

This project is proprietary software for Kavithedal Publications.

## 📞 Contact

For support or inquiries, contact the development team.
