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

- January 15, 2025: Successfully migrated project from Replit Agent to Replit environment
  - Configured PostgreSQL database with proper environment variables
  - Applied database migrations using Drizzle ORM
  - Verified all dependencies are properly installed
  - Application running successfully on Replit

- January 15, 2025: Integrated PayDisini payment gateway for TasPay top up
  - Added PayDisini service with API ID 3246 and proper authentication
  - Created complete wallet system with user_wallets and wallet_transactions tables
  - Implemented top up functionality with multiple payment methods (QRIS, e-wallets, bank transfers)
  - Added TopUpModal component with real-time transaction status checking
  - Integrated top up feature into customer dashboard payment section

## Changelog

- June 21, 2025. Initial setup

## User Preferences

Preferred communication style: Simple, everyday language.
Language preference: Indonesian (Bahasa Indonesia)