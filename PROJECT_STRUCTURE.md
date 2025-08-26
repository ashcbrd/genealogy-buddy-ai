# GenealogyAI Project Structure

This document provides a comprehensive overview of the project structure and organization.

## Root Directory

```
genealogy-ai/
├── README.md                    # Main project documentation
├── AUTHENTICATION.md            # Authentication system documentation  
├── CONTRIBUTING.md              # Contributing guidelines
├── DEPLOYMENT.md                # Deployment guide
├── PROJECT_STRUCTURE.md         # This file
├── package.json                 # Node.js dependencies and scripts
├── next.config.ts              # Next.js configuration
├── tailwind.config.js          # Tailwind CSS configuration
├── tsconfig.json               # TypeScript configuration
├── eslint.config.mjs           # ESLint configuration
├── .eslintrc.json              # ESLint rules override
├── .prettierrc                 # Prettier formatting rules
├── .gitignore                  # Git ignore patterns
├── .env.example                # Environment variables template
├── middleware.ts               # Next.js middleware for auth
├── Dockerfile                  # Production Docker configuration
├── Dockerfile.dev              # Development Docker configuration
├── docker-compose.yml          # Docker compose for development
└── components.json             # shadcn/ui component configuration
```

## Application Structure (`app/`)

### Route Groups
```
app/
├── (auth)/                     # Authentication pages
│   ├── login/page.tsx         # Sign in page
│   └── register/page.tsx      # Sign up page
├── (dashboard)/               # Protected dashboard routes
│   ├── layout.tsx             # Dashboard layout
│   ├── dashboard/page.tsx     # Main dashboard
│   ├── profile/page.tsx       # User profile settings
│   ├── subscription/page.tsx   # Subscription management
│   └── tools/                 # AI tool pages
│       ├── page.tsx           # Tools overview
│       ├── document-analyzer/page.tsx
│       ├── dna-interpreter/page.tsx
│       ├── tree-builder/page.tsx
│       ├── research-copilot/page.tsx
│       └── photo-storyteller/page.tsx
├── admin/page.tsx             # Admin panel
├── api/                       # API routes (see below)
├── layout.tsx                 # Root layout
├── page.tsx                   # Landing page
├── not-found.tsx              # Custom 404 page
├── global-error.tsx           # Global error boundary
├── globals.css                # Global styles
└── favicon.ico                # App icon
```

## API Routes (`app/api/`)

```
api/
├── auth/                      # Authentication endpoints
│   ├── [...nextauth]/route.ts # NextAuth configuration
│   ├── register/route.ts      # User registration
│   ├── forgot-password/route.ts
│   ├── reset-password/route.ts
│   ├── verify-email/route.ts
│   └── resend-verification/route.ts
├── dashboard/                 # Dashboard data endpoints
│   ├── route.ts              # Main dashboard data
│   ├── stats/route.ts        # User statistics
│   ├── activity/route.ts     # Recent activity
│   └── trends/route.ts       # Usage trends
├── tools/                    # AI tool endpoints
│   ├── document/analyze/route.ts
│   ├── dna/analyze/route.ts
│   ├── photo/analyze/route.ts
│   ├── research/chat/route.ts
│   └── tree/
│       ├── expand/route.ts
│       ├── save/route.ts
│       └── export/route.ts
├── subscription/             # Subscription management
│   └── current/route.ts
├── stripe/                   # Stripe integration
│   ├── checkout/route.ts
│   ├── portal/route.ts
│   └── webhook/route.ts
├── upload/                   # File upload endpoints
│   ├── document/route.ts
│   └── photo/route.ts
├── documents/route.ts        # Document management
├── photos/route.ts           # Photo management
└── admin/                    # Admin endpoints
    └── email/route.ts
```

## Components (`components/`)

### UI Components (`components/ui/`)
```
ui/
├── alert.tsx                 # Alert components
├── avatar.tsx                # User avatar component
├── badge.tsx                 # Status badges
├── button.tsx                # Button variants
├── card.tsx                  # Card containers
├── checkbox.tsx              # Form checkboxes
├── dialog.tsx                # Modal dialogs
├── dropdown-menu.tsx         # Dropdown menus
├── input.tsx                 # Form inputs
├── label.tsx                 # Form labels
├── navigation.tsx            # Navigation components
├── progress.tsx              # Progress bars
├── scroll-area.tsx           # Scrollable areas
├── select.tsx                # Select dropdowns
├── separator.tsx             # Visual separators
├── sonner.tsx                # Toast notifications
├── table.tsx                 # Data tables
├── tabs.tsx                  # Tab interfaces
└── textarea.tsx              # Text areas
```

### Feature Components
```
components/
├── auth/
│   └── protected-route.tsx   # Route protection wrapper
├── providers.tsx             # App-wide providers
└── footer.tsx                # Site footer
```

## Library Functions (`lib/`)

```
lib/
├── access-control.ts         # Server-side access control
├── auth.ts                   # NextAuth configuration
├── claude.ts                 # Anthropic Claude integration
├── constants.ts              # App constants
├── email.ts                  # Email service integration
├── logger.ts                 # Structured logging
├── middleware.ts             # Middleware utilities
├── ocr.ts                    # OCR processing
├── prisma.ts                 # Database client
├── s3.ts                     # AWS S3 integration
├── security.ts              # Security utilities
├── stripe.ts                 # Stripe integration
├── utils.ts                  # General utilities
├── validation.ts             # Input validation schemas
└── webhooks.ts               # Webhook handlers
```

## Database (`prisma/`)

```
prisma/
└── schema.prisma             # Database schema definition
```

## Types (`types/`)

```
types/
├── index.ts                  # Main type definitions
└── next-auth.d.ts           # NextAuth type extensions
```

## Static Files (`public/`)

```
public/
├── file.svg                  # Icon assets
├── globe.svg
├── next.svg
├── vercel.svg
└── window.svg
```

## Key Features by Directory

### Authentication (`app/(auth)/`)
- User registration and login
- Password reset functionality
- Email verification
- Social login (Google)

### Dashboard (`app/(dashboard)/`)
- User dashboard with analytics
- Tool usage tracking
- Subscription management
- User profile settings

### AI Tools (`app/(dashboard)/tools/`)
- Document analysis with OCR
- DNA heritage interpretation
- Family tree building
- AI research assistant
- Photo analysis and storytelling

### API Layer (`app/api/`)
- RESTful API endpoints
- Authentication middleware
- Subscription-based access control
- File upload handling
- Webhook processing

### Components (`components/`)
- Reusable UI components (shadcn/ui)
- Authentication guards
- Layout components
- Feature-specific components

### Library (`lib/`)
- Business logic
- External service integrations
- Security utilities
- Database operations

## Development Workflow

### Scripts Available
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run type-check` - TypeScript validation
- `npm run lint` - Code linting
- `npm run format` - Code formatting
- `npm run db:generate` - Generate Prisma client
- `npm run db:push` - Push schema to database

### Code Organization Principles
1. **Feature-based organization** - Related functionality grouped together
2. **Clear separation of concerns** - API, UI, business logic separated
3. **Reusable components** - Common UI patterns extracted
4. **Type safety** - TypeScript throughout
5. **Security-first** - Authentication and access control built-in

### File Naming Conventions
- React components: PascalCase (`UserProfile.tsx`)
- API routes: lowercase with hyphens (`forgot-password/route.ts`)
- Utilities: camelCase (`userUtils.ts`)
- Constants: UPPER_SNAKE_CASE (`API_ENDPOINTS`)

This structure supports scalability, maintainability, and follows Next.js 13+ App Router best practices.