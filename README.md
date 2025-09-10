# TheKua - Traditional Sweets E-commerce Website

A full-stack e-commerce application for traditional Indian sweets built with Node.js, Express, MongoDB, and React.

## 🚀 Features

### Backend (Server)
- **Authentication & Authorization**
  - JWT-based authentication
  - Role-based access control (User/Admin)
  - Password hashing with bcrypt
  - Social authentication (Google/Facebook)
  - Password reset functionality

- **Products Management**
  - CRUD operations for products
  - Image upload with Cloudinary
  - Product categories and filtering
  - Search functionality
  - Inventory management

- **Order Management**
  - Complete order lifecycle
  - Order status tracking
  - Payment integration (Razorpay)
  - Email notifications

- **Payment Integration**
  - Razorpay payment gateway
  - COD (Cash on Delivery) support
  - Payment verification
  - Order confirmation

- **Admin Features**
  - Dashboard with analytics
  - Product management
  - Order management
  - User management
  - Coupon management

### Frontend (Client)
- **Modern React Application**
  - React 18 with functional components
  - React Router for navigation
  - Context API for state management
  - React Query for data fetching

- **User Experience**
  - Responsive design with Tailwind CSS
  - Smooth animations with Framer Motion
  - Shopping cart functionality
  - Product search and filtering
  - User authentication

- **UI Components**
  - Modern, clean design
  - Interactive product cards
  - Mobile-first responsive layout
  - Loading states and error handling

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB with Mongoose
- **Authentication**: JWT, bcryptjs
- **File Upload**: Cloudinary
- **Payment**: Razorpay
- **Email**: Nodemailer
- **Validation**: express-validator
- **Security**: Helmet, CORS, Rate limiting

### Frontend
- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Routing**: React Router v6
- **State Management**: Context API
- **Data Fetching**: React Query
- **Forms**: React Hook Form
- **Animations**: Framer Motion
- **Icons**: Lucide React
- **Notifications**: React Hot Toast

## 📦 Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- MongoDB (local or cloud)
- Git

### 1. Clone the Repository
```bash
git clone <repository-url>
cd Website-main
```

### 2. Backend Setup
```bash
cd server

# Install dependencies
npm install

# Create .env file (already exists with sample data)
# Update the following variables in .env:
# - MONGODB_URI (your MongoDB connection string)
# - JWT_SECRET (your JWT secret)
# - CLOUDINARY credentials (if using image uploads)
# - RAZORPAY credentials (for payments)

# Start the server
npm run dev
```

The backend will run on `http://localhost:5001`

### 3. Frontend Setup
```bash
cd client

# Install dependencies
npm install

# Start the development server
npm run dev
```

The frontend will run on `http://localhost:3001`

## 🌐 Environment Variables

### Server (.env)
```
NODE_ENV=development
PORT=5001
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRE=7d
JWT_REFRESH_EXPIRE=30d
ADMIN_EMAIL=admin@thekua.com
ADMIN_PASSWORD=Admin@123
FRONTEND_URL=http://localhost:3001
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
RAZORPAY_KEY_ID=your_razorpay_key
RAZORPAY_SECRET_KEY=your_razorpay_secret
```

## 🚀 Deployment

### Backend Deployment
1. Deploy to platforms like Heroku, Railway, or DigitalOcean
2. Set environment variables
3. Ensure MongoDB is accessible
4. Update CORS settings for production domain

### Frontend Deployment
1. Build the production version:
   ```bash
   npm run build
   ```
2. Deploy to platforms like Vercel, Netlify, or AWS
3. Update API endpoints for production

## 📝 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile
- `POST /api/auth/forgot-password` - Password reset request

### Products
- `GET /api/products` - Get all products (with filters)
- `GET /api/products/:id` - Get single product
- `GET /api/products/featured/list` - Get featured products

### Orders (Protected)
- `POST /api/orders` - Create new order
- `GET /api/orders` - Get user orders
- `GET /api/orders/:id` - Get order details

### Admin (Admin Only)
- `GET /api/admin/dashboard` - Dashboard stats
- `GET /api/admin/products` - Manage products
- `GET /api/admin/orders` - Manage orders
- `GET /api/admin/users` - Manage users

## 🎨 Design Features

- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Modern UI**: Clean, professional design with smooth animations
- **Accessibility**: Proper semantic HTML and ARIA labels
- **Performance**: Optimized images and lazy loading
- **SEO Friendly**: Proper meta tags and structured data

## 🔐 Security Features

- **Authentication**: JWT tokens with refresh mechanism
- **Authorization**: Role-based access control
- **Data Validation**: Input sanitization and validation
- **Rate Limiting**: API rate limiting to prevent abuse
- **CORS**: Configured for secure cross-origin requests
- **Helmet**: Security headers for Express

## 🧪 Testing

```bash
# Backend tests
cd server
npm test

# Frontend tests (when implemented)
cd client
npm test
```

## 📱 Mobile Support

The application is fully responsive and optimized for:
- Mobile phones (320px+)
- Tablets (768px+)
- Desktops (1024px+)
- Large screens (1440px+)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 📞 Support

For support, email: hello@thekua.com

## 🎯 Future Enhancements

- [ ] Real-time order tracking
- [ ] Push notifications
- [ ] Multiple payment gateways
- [ ] Loyalty program
- [ ] Product reviews and ratings
- [ ] Inventory alerts
- [ ] Multi-language support
- [ ] Advanced analytics dashboard
