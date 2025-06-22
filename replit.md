# FoodieID - Food Delivery Platform

## Overview

FoodieID (also called TasFood) is a comprehensive food delivery platform designed for the Indonesian market. The application serves multiple user types including customers, restaurant partners, delivery drivers, and administrators. It's built as a full-stack web application with real-time features for order tracking and communication.

## System Architecture

The application follows a modern full-stack architecture:

- **Frontend**: React with TypeScript, Vite for bundling, Tailwind CSS for styling
- **Backend**: Express.js server with TypeScript
- **Database**: PostgreSQL with Drizzle ORM for database operations
- **Real-time Communication**: WebSocket server for live order updates
- **Authentication**: JWT-based authentication with role-based access control
- **Deployment**: Configured for Vercel deployment with serverless functions

## Key Components

### Frontend Architecture
- **React SPA**: Single-page application using Wouter for routing
- **Component Library**: Custom UI components built with Radix UI and shadcn/ui
- **State Management**: React Query for server state, React Context for client state
- **Responsive Design**: Mobile-first approach with Tailwind CSS
- **Multi-role Dashboards**: Separate interfaces for customers, restaurants, drivers, and admin

### Backend Architecture
- **RESTful API**: Express.js server with organized route handlers
- **Database Layer**: Drizzle ORM with PostgreSQL for data persistence
- **WebSocket Server**: Real-time communication for order updates
- **File Upload**: Multer for handling image uploads (food photos, logos)
- **Authentication Middleware**: JWT token validation and role-based access

### Database Schema
- **Users**: Multi-role user system (customer, driver, restaurant, admin)
- **Food Items**: Product catalog with categories, pricing, and availability
- **Orders**: Complete order lifecycle management with status tracking
- **Restaurants**: Partner restaurant profiles and management
- **Drivers**: Delivery driver profiles with location tracking
- **Cart System**: Session-based shopping cart functionality

## Data Flow

1. **Customer Journey**: Browse menu → Add to cart → Checkout → Payment → Order tracking
2. **Restaurant Flow**: Receive orders → Update status → Prepare food → Ready for pickup
3. **Driver Workflow**: Accept delivery → Navigate to restaurant → Pickup → Deliver → Complete
4. **Real-time Updates**: WebSocket broadcasts order status changes to all relevant parties

## External Dependencies

### Core Dependencies
- **@neondatabase/serverless**: Database connection for Neon PostgreSQL
- **@tanstack/react-query**: Server state management and caching
- **@radix-ui/***: Accessible UI component primitives
- **drizzle-orm**: Type-safe database ORM
- **leaflet**: Interactive maps for location services
- **bcrypt**: Password hashing for security
- **jsonwebtoken**: JWT token generation and validation

### Development Tools
- **Vite**: Fast development server and build tool
- **TypeScript**: Type safety across the application
- **ESBuild**: Fast JavaScript bundling for production
- **Tailwind CSS**: Utility-first CSS framework

## Deployment Strategy

The application is configured for multiple deployment targets:

### Vercel Deployment (Primary)
- **Static Frontend**: Built and served from `/client/dist/`
- **Serverless API**: Backend functions in `/api/` directory
- **Environment Variables**: Database credentials and app configuration
- **Edge Optimization**: CDN distribution for static assets

### Development Environment
- **Local Development**: Concurrent frontend and backend servers
- **Hot Reload**: Vite HMR for rapid development iterations
- **Database**: Local PostgreSQL or cloud database connection

### Production Considerations
- **Database Migration**: Automated schema deployment with Drizzle
- **File Storage**: Local uploads (can be extended to cloud storage)
- **WebSocket Scaling**: Single server setup (can be enhanced with Redis)
- **Security**: HTTPS enforcement, CORS configuration, input validation

## Recent Changes

- Januari 22, 2025: Berhasil migrasi proyek dari Replit Agent ke Replit environment
  - Membersihkan 15+ file duplikat dan komponen yang tidak terpakai
  - Mengoptimalkan kode dengan menghapus import dan variabel yang tidak digunakan
  - Memperbaiki file wallet.ts dengan Drizzle ORM yang konsisten
  - Menghapus semua error TypeScript dan LSP untuk performa yang lebih baik
  - Aplikasi kini berjalan dengan lebih ringan dan efisien

- Januari 22, 2025: Implementasi Dashboard Mitra Restoran dengan fitur lengkap seperti GoBiz
  - Created comprehensive restaurant partner dashboard dengan 5 tab utama:
    - Beranda: Overview statistik, pesanan hari ini, pendapatan, rating
    - Pesanan: Kelola semua pesanan dengan status tracking real-time
    - Menu: Manajemen menu lengkap dengan search, filter, toggle availability
    - Laporan: Analytics dan metrik performa restoran
    - Profil: Edit profil restoran dan pengaturan akun
  - Added security features untuk restaurant dashboard:
    - JWT authentication untuk semua restaurant endpoints
    - Ownership verification untuk menu dan orders
    - Role-based access control
  - Enhanced API endpoints:
    - GET /api/food-items/restaurant/:id untuk menu by restaurant
    - PATCH /api/food-items/:id/toggle untuk toggle availability
    - Authentication pada semua restaurant-specific endpoints
  - UI/UX improvements:
    - Mobile-first responsive design dengan bottom navigation
    - Real-time status updates untuk orders
    - Search dan filter functionality untuk menu management
    - Statistics cards dengan visual indicators
    - Professional GoBiz-style interface

- Januari 22, 2025: Berhasil migrasi dan penguatan keamanan aplikasi FoodieID
  - Configured PostgreSQL database dengan environment variables yang aman
  - Applied database migrations menggunakan Drizzle ORM (13 tabel berhasil dibuat)
  - Menginstal dan mengonfigurasi package keamanan: helmet, cors, express-rate-limit
  - Implementasi JWT authentication dengan kunci rahasia yang kuat
  - Menambahkan validasi input dan sanitisasi untuk mencegah injection attacks
  - Konfigurasi rate limiting: 100 req/15min umum, 5 req/15min untuk auth endpoints
  - Upload file security dengan filter tipe file dan sanitisasi nama file
  - Trust proxy configuration untuk lingkungan Replit
  - **KEAMANAN FITUR MAPS**: Implementasi keamanan lokasi driver dan customer
    - Autentikasi wajib untuk akses/update lokasi driver
    - Validasi koordinat Indonesia (mencegah koordinat palsu)
    - Rate limiting khusus untuk update lokasi (20/menit)
    - Driver hanya bisa update lokasi sendiri
    - Customer hanya bisa lihat lokasi driver yang melayani order mereka
    - Validasi WebSocket untuk real-time location updates
  - **KEAMANAN DASHBOARD RESTORAN**: Implementasi autentikasi ketat untuk semua endpoint
    - JWT token wajib untuk semua API restaurant
    - Validasi kepemilikan: restaurant hanya bisa akses data sendiri
    - Endpoint profile, orders, menu, stats dilindungi authenticateToken
    - Role-based access control untuk restaurant/customer/driver
    - Auto-attach JWT token pada semua request dari frontend
  - Aplikasi berjalan dengan aman di port 5000 dengan semua fitur keamanan aktif

- January 15, 2025: Implemented comprehensive driver dashboard features
  - Enhanced driver profile management with complete CRUD operations
  - Built full-featured wallet system with transaction history and withdrawal functionality
  - Created comprehensive settings panel with notifications, working hours, location, and security settings
  - All tab features (Beranda, Order, Dompet, Profil, Pengaturan) now fully functional
  - Added proper form validation and error handling throughout the dashboard
  - Integrated real-time data updates and proper state management

- January 15, 2025: Completed 100% real functionality for security features
  - Implemented PIN change with bcrypt validation and database updates
  - Added password change with proper authentication and security checks
  - Created real-time driver status toggle with database persistence
  - Added comprehensive modal interfaces with full validation
  - All security features now connect to actual database operations
  - Cleaned up status driver interface by removing redundant controls

- January 15, 2025: Integrated PayDisini payment gateway for TasPay top up
  - Added PayDisini service with API ID 3246 and proper authentication
  - Created complete wallet system with user_wallets and wallet_transactions tables
  - Implemented top up functionality with DANA payment method only (per user preference)
  - Added TopUpModal component with real-time transaction status checking
  - Integrated top up feature into customer dashboard payment section

- January 15, 2025: Created TasPay activation feature
  - Built ActivateTasPayModal component for secure PIN creation
  - Added wallet activation endpoint with PIN hashing for security
  - Integrated activation feature into customer dashboard and checkout page
  - Implemented conditional UI showing "Aktifkan" button when wallet is inactive
  - Added automatic wallet data refresh after successful activation

- January 15, 2025: Redesigned driver dashboard with Maxim-style interface
  - Implemented dark theme with yellow accents for mobile-first design
  - Added clean header with driver profile, online/offline status toggle
  - Created active order detail section with pickup/destination points
  - Integrated action buttons: Terima Order, Sudah Tiba, Mulai Perjalanan, Selesai
  - Added bottom navigation with Beranda, Order, Dompet, Profil, Pengaturan tabs
  - Included map placeholder for route navigation and directions

## Changelog

- June 21, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Language preference: Indonesian (Bahasa Indonesia)