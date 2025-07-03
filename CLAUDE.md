# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

MasterMarket is a full-stack e-commerce/price tracking application with:
- **Backend**: FastAPI (Python) with PostgreSQL database
- **Mobile**: React Native with Expo and TypeScript
- **Infrastructure**: Docker Compose for local development, AWS EC2 for deployment

## Common Development Commands

### Backend Development

```bash
# Start backend and database (from project root)
docker-compose up --build

# Or use the Windows batch script
./startbackend.bat

# Access the API
# http://localhost:8000
# API docs: http://localhost:8000/docs
```

### Mobile Development

```bash
# Navigate to mobile directory
cd mobile

# Install dependencies
npm install

# Start Expo development server
npm start
# Or: npx expo start --clear

# Run on specific platform
npm run android
npm run ios
npm run web

# Run tests
npm test
```

### Database Access

```bash
# PostgreSQL runs in Docker on port 5432
# Database: mastermarket_db
# User: mastermarket
# Password: securepassword

# Load sample data
psql -h localhost -U mastermarket -d mastermarket_db -f insert_sample_data.sql
```

## Architecture Overview

### Backend Structure (`/backend`)

The FastAPI backend follows a modular architecture:

- **Entry Point**: `app/main.py` - FastAPI application with CORS middleware
- **Database Models**: `app/models.py` - SQLAlchemy ORM models for:
  - Users (with authentication)
  - Products (with categories like food, beverages, household items)
  - Prices (community-submitted pricing)
  - Baskets (shopping carts)
  - Price History tracking
- **API Routes**: `app/routes/` - Organized by feature:
  - `admin.py` - Admin operations
  - `basket.py` - Shopping cart management
  - `products.py` - Product CRUD operations
  - `prices.py` - Price submissions and management
  - `users.py` - User authentication and profile
- **Authentication**: JWT-based authentication in `app/auth.py`
- **Database Operations**: `app/crud.py` - Centralized database queries
- **Image Storage**: AWS S3 integration via boto3 for product images

### Mobile Structure (`/mobile`)

React Native app using Expo Router for file-based navigation:

- **Navigation**: `app/(tabs)/` - Tab-based navigation
  - `index.tsx` - Home screen with product listings
  - `basket.tsx` - Shopping cart functionality
  - `admin.tsx` - Admin panel (role-based)
  - `me.tsx` - User profile and settings
- **Authentication**: `app/login.tsx` and `context/AuthContext.tsx`
- **State Management**: Context API
  - `AuthContext` - User authentication state
  - `BasketContext` - Shopping cart state
- **API Integration**: `services/api.ts` - Axios-based API client with interceptors
- **TypeScript**: Strict mode enabled with path aliases (`@/` for root)

### Key Features Implementation

1. **Community Pricing**: Users can submit and view prices for products
2. **Shopping Basket**: Add/remove products, manage quantities
3. **Price History**: Track price changes over time
4. **Admin Panel**: Product and price management for admin users
5. **Image Upload**: Product images stored in AWS S3

## Development Workflow

### Feature Development
1. Create feature branch from main
2. Backend changes in `/backend/app/`
3. Mobile changes in `/mobile/`
4. Test locally with Docker Compose
5. Push changes - triggers SonarQube analysis
6. Create PR - auto-deploys to EC2 when merged to main

### API Development Pattern
1. Define Pydantic schemas in `schemas.py`
2. Create/update SQLAlchemy models in `models.py`
3. Add CRUD operations in `crud.py`
4. Create route handlers in appropriate route file
5. FastAPI auto-generates OpenAPI docs at `/docs`

### Mobile Development Pattern
1. Components go in `/mobile/components/`
2. Screens use file-based routing in `/mobile/app/`
3. API calls through `services/api.ts`
4. Context for global state management
5. TypeScript for type safety

## Important Notes

- **Environment Variables**: Backend uses `.env` file (not tracked in git)
- **Database**: Manual schema updates required - added user fields: country, currency, google_id, avatar_url, provider
- **Testing**: Jest configured for mobile, no pytest setup for backend yet
- **Current Branch**: `feature/communityprices` - implementing community-submitted pricing
- **CI/CD**: GitHub Actions for SonarQube analysis and EC2 deployment
- **No Linting**: Project lacks ESLint/Prettier configuration

## Google OAuth Setup (Pending Configuration)

### 🔧 Steps to Complete Google OAuth Integration:

#### **1. Google Cloud Console Setup**
- Go to [Google Cloud Console](https://console.cloud.google.com/)
- Use existing project OR create new project named `MasterMarket`

#### **2. Enable Required APIs**
- Navigate to **"APIs & Services"** → **"Library"** 
- Enable these APIs:
  - **"Google+ API"** (or "People API")
  - **"OAuth2 API"**

#### **3. Configure OAuth Consent Screen**
- Go to **"APIs & Services"** → **"OAuth consent screen"**
- Select **"External"** → Continue
- Fill out required fields:
  - **App name**: `MasterMarket`
  - **User support email**: your email
  - **Developer contact**: your email
- Save and Continue through all steps

#### **4. Create OAuth 2.0 Client IDs**

**4.1 Android Client ID:**
- **"APIs & Services"** → **"Credentials"** → **"Create Credentials"** → **"OAuth 2.0 Client ID"**
- **Application type**: `Android`
- **Name**: `MasterMarket Android`
- **Package name**: `com.mastermarket.mobile`
- **SHA-1 certificate fingerprint**: `ED:E0:8C:C0:EF:75:8F:DD:7F:9C:97:09:DF:C8:A5:C2:4A:2C:7E:62`

**4.2 Web Client ID (for backend):**
- **"Create Credentials"** → **"OAuth 2.0 Client ID"**
- **Application type**: `Web application`
- **Name**: `MasterMarket Backend`
- **Authorized JavaScript origins**:
  ```
  http://localhost:8000
  http://192.168.1.25:8000
  ```
- **Authorized redirect URIs**:
  ```
  http://localhost:8000/auth/google/callback
  http://192.168.1.25:8000/auth/google/callback
  ```

#### **5. Update Code with Client IDs**
After obtaining the Client IDs, update:
- `mobile/app/login.tsx` - Replace `YOUR_GOOGLE_CLIENT_ID` with actual Android Client ID
- Backend Google OAuth verification to use Web Client ID

### 🔐 Current SHA-1 Fingerprint
Generated keystore fingerprint: `ED:E0:8C:C0:EF:75:8F:DD:7F:9C:97:09:DF:C8:A5:C2:4A:2C:7E:62`

### ✅ What's Already Implemented
- Backend OAuth endpoint: `/users/google-auth`
- User registration with country/currency selection (9 countries supported)
- Database schema updated with Google OAuth fields
- Frontend Google Sign-In button with Android Client ID: `758094174857-jc1vg7gutghv72htsgo4vlvk926bkm32.apps.googleusercontent.com`

### 🚧 Status
- Regular email/password registration: ✅ Working
- Country/currency selection: ✅ Working  
- Google OAuth: ✅ Implemented with expo-auth-session

## Local Development Setup for Google OAuth

When developing locally with Google OAuth, use the localhost approach:

1. **Google Console Configuration:**
   - Authorized JavaScript origins: `http://localhost:8000`
   - Authorized redirect URIs: `http://localhost:8000/auth/google/callback`

2. **Access Backend:**
   - Use `http://localhost:8000` in your browser for OAuth testing
   - API docs: `http://localhost:8000/docs`

3. **Mobile App Configuration:**
   The mobile app is configured to automatically use the correct URL based on the platform:
   - Android Emulator: `http://10.0.2.2:8000` (points to host's localhost)
   - iOS Simulator: `http://localhost:8000`
   - Physical Device: `http://192.168.1.25:8000` (your machine's IP)