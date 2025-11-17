# Operational Intelligence Platform for Micro-Lending

## Overview

This is a full-stack operational intelligence platform designed for Kechita Microfinance Group (KMG), a nationwide micro-lending company operating across 8 regions in Kenya with ~100+ branches and 120,000+ active borrowers. The platform provides real-time dashboards, fraud detection using XGBoost ML models, customer 360 views, branch performance analytics, and AI-powered insights through multi-agent analysis.

The application processes micro-lending data including loans, repayments, customer profiles, branch performance metrics, and fraud signals to deliver actionable intelligence for CEO-level decision making, regional management, and operational efficiency.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: shadcn/ui components built on Radix UI primitives
- **Styling**: TailwindCSS with custom Material Design-inspired theme focusing on data density and enterprise patterns
- **State Management**: TanStack Query (React Query) for server state and data fetching
- **Routing**: wouter for lightweight client-side routing
- **Charts**: Chart.js for data visualizations (trend charts, bar charts)
- **Design System**: Custom theme based on Material Design principles prioritizing information density, operational efficiency, and clear hierarchy through scale

**Key Design Decisions**:
- Typography uses Inter/Roboto fonts optimized for data readability
- Component spacing follows Tailwind's 4-6-8-12-16-24 unit system
- Dashboard uses responsive grid layouts (4-column KPI cards, 2-column comparative charts)
- Dark/light theme support with custom CSS variables for consistent theming

### Backend Architecture

**Framework**: Express.js with TypeScript running on Node.js
- **API Pattern**: RESTful endpoints under `/api/*` namespace
- **Database Access**: Storage abstraction layer (`IStorage` interface) for decoupled data access
- **Development Mode**: Vite integration for HMR and SSR during development
- **Production Mode**: Static file serving with pre-built frontend bundle

**API Endpoints Structure**:
- `/api/dashboard/metrics` - Aggregated CEO-level KPIs
- `/api/customers/*` - Customer search, profiles, and 360 views
- `/api/branches/*` - Branch listing and performance metrics
- `/api/fraud/*` - Fraud detection cases and signals
- `/api/analytics/*` - Regional analytics and comparisons
- `/api/upload/*` - CSV file upload and data ingestion

**Architecture Rationale**: Express was chosen for its simplicity and Vercel serverless compatibility. The storage abstraction allows easy switching between database implementations without changing business logic.

### Data Storage

**Database**: PostgreSQL accessed via Drizzle ORM
- **Connection**: Neon serverless PostgreSQL with WebSocket support
- **Schema Management**: Drizzle Kit for migrations and schema definition
- **ORM Pattern**: Type-safe schema definitions with Zod validation

**Schema Design**:
- `customers` - Customer profiles with demographics, business type, fraud flags
- `branches` - Branch locations with geographic coordinates and staffing
- `officers` - Field officers assigned to branches
- `loans` - Loan records with product type, amounts, status, dates
- `repayments` - Weekly repayment transactions
- `daily_branch_performance` - Daily metrics per branch (targets, collections, disbursements)
- `monthly_branch_summary` - Monthly aggregated branch statistics
- `officer_performance` - Individual officer productivity metrics
- `fraud_signals` - ML-detected fraud indicators
- `ai_customer_features` - XGBoost-derived risk scores, default probabilities, churn predictions
- `ml_model` - Model versioning and metadata

**Database Choice Rationale**: PostgreSQL provides ACID compliance, excellent aggregation performance for analytics queries, and geographic data support (latitude/longitude). Drizzle ORM offers type safety while maintaining SQL flexibility needed for complex analytics.

### Machine Learning Integration

**Framework**: XGBoost (referenced in design but implementation details in AI features table)
- Risk scoring (0-100 scale)
- Default probability prediction
- Churn probability analysis
- Recommended credit limit calculations

**ML Pipeline**:
1. Feature extraction from loan/repayment history stored in `ai_customer_features`
2. Model artifacts stored in `ml_model` table with versioning
3. Predictions exposed via API endpoints
4. Real-time fraud signal generation

### Authentication & Authorization

**Status**: Not yet implemented
- Design supports session-based authentication with `connect-pg-simple` for PostgreSQL session storage
- Future implementation will likely use role-based access (CEO, Regional Manager, Branch Manager, Officer)

### Build & Deployment Strategy

**Development**:
- Vite dev server with HMR for frontend
- tsx for TypeScript execution of backend
- Concurrent frontend/backend development

**Production Build**:
- Frontend: Vite builds to `dist/public`
- Backend: esbuild bundles server code to `dist/index.js`
- Single Node.js process serves both static files and API

**Deployment Targets**:
- Replit: Full-stack development environment with integrated PostgreSQL
- Vercel: Serverless deployment (configured in build scripts)

**Rationale**: This monorepo structure with unified build process simplifies deployment while maintaining separation of concerns. Vite provides fast rebuilds during development, and the production build creates optimized bundles for serverless platforms.

## External Dependencies

### Third-Party Services

**Neon Database** (`@neondatabase/serverless`)
- Serverless PostgreSQL provider
- WebSocket-based connection pooling
- Used as primary data store

**Groq API** (referenced in AI insights page)
- AI-powered multi-agent analysis system
- Provides fraud validation, forecasting, messaging agents
- Integrates with operational data for smart explanations

### Key NPM Packages

**Frontend**:
- `@radix-ui/*` - Headless UI components (20+ components)
- `@tanstack/react-query` - Server state management
- `chart.js` + `react-chartjs-2` - Data visualization
- `tailwindcss` - Utility-first CSS framework
- `class-variance-authority` + `clsx` - Component styling utilities
- `react-hook-form` + `@hookform/resolvers` - Form management
- `zod` - Runtime validation
- `date-fns` - Date manipulation

**Backend**:
- `express` - Web framework
- `drizzle-orm` + `drizzle-kit` - Database ORM and migrations
- `connect-pg-simple` - PostgreSQL session store
- `ws` - WebSocket client for Neon
- `nanoid` - Unique ID generation

**Build Tools**:
- `vite` - Frontend build tool
- `esbuild` - Backend bundler
- `typescript` - Type checking
- `tsx` - TypeScript execution

### External APIs

**Google Fonts CDN**
- Inter and Roboto font families
- Loaded via CDN for performance

**Potential Future Integrations** (based on domain):
- M-Pesa API for payment processing (referenced in company profile)
- SMS gateway for customer notifications
- Geographic mapping services for branch visualization