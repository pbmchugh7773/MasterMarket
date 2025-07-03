# MasterMarket Architecture Diagram

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    CLOUD INFRASTRUCTURE                              │
│  ┌─────────────────────┐                                   ┌──────────────────────┐ │
│  │     AWS EC2         │                                   │      AWS S3          │ │
│  │  (Production API)   │                                   │  (Image Storage)     │ │
│  └─────────────────────┘                                   └──────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    FRONTEND LAYER                                    │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                           MOBILE APP (React Native + Expo)                     │  │
│  │                                                                                │  │
│  │  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐  ┌────────────┐ │  │
│  │  │   Home Screen   │  │ Basket Screen  │  │  Admin Panel   │  │ Profile/Me │ │  │
│  │  │   (index.tsx)   │  │  (basket.tsx)  │  │  (admin.tsx)   │  │  (me.tsx)  │ │  │
│  │  └────────────────┘  └────────────────┘  └────────────────┘  └────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                          Context API State Management                     │ │  │
│  │  │  ┌─────────────────┐              ┌──────────────────┐                  │ │  │
│  │  │  │   AuthContext   │              │  BasketContext   │                  │ │  │
│  │  │  │ (User Auth State)│              │ (Shopping Cart)  │                  │ │  │
│  │  │  └─────────────────┘              └──────────────────┘                  │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         API Service Layer                                │ │  │
│  │  │                    (services/api.ts - Axios Client)                      │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ HTTP/HTTPS
                                          │ REST API
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                    BACKEND LAYER                                     │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                         FASTAPI APPLICATION (Python)                           │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐    ┌──────────────────────────────────────────────────┐ │  │
│  │  │   main.py       │    │              API Routes                           │ │  │
│  │  │  (Entry Point)  │    │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │  │
│  │  │  - CORS Config  │───▶│  │ Products │ │  Prices  │ │     Basket       │ │ │  │
│  │  │  - Middleware   │    │  │  Route   │ │  Route   │ │     Route        │ │ │  │
│  │  └─────────────────┘    │  └──────────┘ └──────────┘ └──────────────────┘ │ │  │
│  │                          │  ┌──────────┐ ┌──────────┐ ┌──────────────────┐ │ │  │
│  │                          │  │  Users   │ │  Admin   │ │ Community Prices │ │ │  │
│  │                          │  │  Route   │ │  Route   │ │     Route        │ │ │  │
│  │                          │  └──────────┘ └──────────┘ └──────────────────┘ │ │  │
│  │                          └──────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────┐    ┌─────────────────┐    ┌────────────────────────┐   │  │
│  │  │   auth.py       │    │    crud.py      │    │     schemas.py         │   │  │
│  │  │ (JWT Auth)      │    │ (DB Operations) │    │ (Pydantic Models)      │   │  │
│  │  └─────────────────┘    └─────────────────┘    └────────────────────────┘   │  │
│  │                                                                                │  │
│  │  ┌────────────────────────────────────────────────────────────────────────┐  │  │
│  │  │                        SQLAlchemy ORM Layer                             │  │  │
│  │  │                           (models.py)                                   │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌─────────────┐ │  │  │
│  │  │  │  Users   │ │ Products │ │  Prices  │ │  Basket  │ │  Community  │ │  │  │
│  │  │  │  Model   │ │  Model   │ │  Model   │ │  Model   │ │   Prices    │ │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘ └─────────────┘ │  │  │
│  │  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────┐                  │  │  │
│  │  │  │  Price   │ │ Generic  │ │  Price   │ │  Stores  │                  │  │  │
│  │  │  │ History  │ │ Products │ │  Votes   │ │  Model   │                  │  │  │
│  │  │  └──────────┘ └──────────┘ └──────────┘ └──────────┘                  │  │  │
│  │  └────────────────────────────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
                                          │
                                          │ PostgreSQL Protocol
                                          │ Port 5432
                                          ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                                  DATABASE LAYER                                      │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐  │
│  │                          PostgreSQL Database                                   │  │
│  │                         (Docker Container)                                     │  │
│  │                                                                                │  │
│  │  Database: mastermarket_db                                                     │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                              USERS TABLE                                  │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, email, hashed_password, full_name, location, country, currency,      │ │  │
│  │  │ google_id, avatar_url, provider, is_active, is_premium, role, created_at │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                            PRODUCTS TABLE                                 │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, name, description, category, brand, quantity, image_url,              │ │  │
│  │  │ barcode, generic_product_id (FK)                                         │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                        GENERIC_PRODUCTS TABLE                             │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, name, description, category, image_url                                │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                             PRICES TABLE                                  │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, product_id (FK), supermarket, price, updated_at                       │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         PRICE_HISTORY TABLE                               │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, product_id (FK), supermarket, price, recorded_at                      │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                             BASKET TABLE                                  │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, user_id, product_id (FK), quantity, added_at                          │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                       COMMUNITY_PRICES TABLE                              │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, product_id (FK), user_id (FK), store_name, store_location, price,    │ │  │
│  │  │ price_photo_url, currency, upvotes, downvotes, verification_status,      │ │  │
│  │  │ created_at, updated_at                                                    │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                         PRICE_VOTES TABLE                                 │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, price_id (FK to community_prices), user_id (FK), vote_type,          │ │  │
│  │  │ created_at (Unique: one vote per user per price)                          │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  │                                                                                │  │
│  │  ┌─────────────────────────────────────────────────────────────────────────┐ │  │
│  │  │                            STORES TABLE                                   │ │  │
│  │  ├─────────────────────────────────────────────────────────────────────────┤ │  │
│  │  │ id, name, chain, address, city, postcode, latitude, longitude,           │ │  │
│  │  │ opening_hours, phone, website, created_at, updated_at                    │ │  │
│  │  └─────────────────────────────────────────────────────────────────────────┘ │  │
│  └──────────────────────────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────────────────────┘
```

## Data Flow

### 1. User Authentication Flow
```
Mobile App → Login Screen → API Service → /users/login → JWT Token → AuthContext → Authenticated State
                                     ↘
                                      → /users/google-auth → Google OAuth → User Creation/Login
```

### 2. Product Browsing Flow
```
Mobile App → Home Screen → API Service → /products → Backend CRUD → PostgreSQL → Product List
                                                                 ↘
                                                                  → Generic Products Join
```

### 3. Community Price Submission
```
Mobile App → Price Form → API Service → /community-prices → Backend Validation → PostgreSQL 
                                                                              ↘
                                                                               → Price History
                                                                               → Price Votes
```

### 4. Shopping Basket Flow
```
Mobile App → Add to Basket → BasketContext → API Service → /basket → Backend → PostgreSQL
```

### 5. Image Upload Flow
```
Mobile App → Image Selection → API Service → /products/upload → Backend → AWS S3 → Image URL → PostgreSQL
```

### 6. Store Management Flow
```
Admin Panel → Store Form → API Service → /stores → Backend → PostgreSQL → Store Data
```

## Technology Stack

### Frontend
- **Framework**: React Native with Expo
- **Navigation**: Expo Router (file-based)
- **Language**: TypeScript
- **State Management**: React Context API
- **HTTP Client**: Axios
- **Authentication**: JWT tokens + Google OAuth (expo-auth-session)
- **Storage**: AsyncStorage for tokens

### Backend
- **Framework**: FastAPI (Python)
- **ORM**: SQLAlchemy
- **Authentication**: JWT (python-jose) + Google OAuth
- **Validation**: Pydantic
- **Image Storage**: AWS S3 (boto3)
- **Task Queue**: Celery (for background tasks)
- **CORS**: Configured for mobile origins

### Database
- **RDBMS**: PostgreSQL 13+
- **Containerization**: Docker
- **Connection**: psycopg2
- **Migrations**: Alembic (manual migrations)

### Infrastructure
- **Local Development**: Docker Compose
- **Production**: AWS EC2
- **CI/CD**: GitHub Actions
- **Code Quality**: SonarQube
- **Container Registry**: Docker Hub

## Communication Protocols

1. **REST API**: All communication between mobile app and backend
2. **JWT Tokens**: Stored in AsyncStorage, sent as Bearer tokens
3. **CORS**: Configured for mobile app origins
4. **PostgreSQL Protocol**: Database communication on port 5432

## Security Measures

- JWT token-based authentication
- Password hashing with bcrypt
- CORS protection
- Environment variables for secrets
- Role-based access control (admin routes)
- SQL injection prevention via ORM
- Google OAuth integration
- Community price verification system

## Key Relationships

1. **Users ↔ Community Prices**: One-to-many (users submit prices)
2. **Products ↔ Generic Products**: Many-to-one (multiple specific products per generic)
3. **Community Prices ↔ Price Votes**: One-to-many (voting system)
4. **Users ↔ Basket**: One-to-many (user shopping carts)
5. **Products ↔ Prices**: One-to-many (price tracking)
6. **Products ↔ Price History**: One-to-many (historical data)