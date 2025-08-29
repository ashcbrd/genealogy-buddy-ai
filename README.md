# Genealogy Buddy AI - AI-Powered Family History Research Platform

A comprehensive micro-SaaS application that uses AI to help users discover and document their family history through intelligent document analysis, DNA interpretation, family tree building, and more.

## Features

### 🎯 Five AI-Powered Genealogy Tools

1. **Document Analyzer** - Extract names, dates, places, and relationships from historical documents
2. **DNA Interpreter** - Understand genetic heritage with plain-language explanations
3. **Family Tree Builder** - Build comprehensive family trees with AI suggestions
4. **Research Copilot** - Get expert genealogy guidance from an AI assistant
5. **Photo Storyteller** - Analyze historical photos and generate family narratives

### 💳 Subscription Tiers

- **Free** - 5 documents, 2 photos, 3 family trees, 10 research questions
- **Explorer ($19/mo)** - 50 documents, 25 photos, unlimited trees, 100 research questions, 3 DNA analyses
- **Researcher ($39/mo)** - 200 documents, 100 photos, unlimited trees, unlimited research, 10 DNA analyses
- **Professional ($79/mo)** - Unlimited everything, API access, white-label options, dedicated support

### 🔐 Authentication & Security

- Email/password and Google OAuth login
- Secure password reset flow
- Email verification
- Session management with NextAuth.js

### 💰 Payment Processing

- Stripe subscription management
- Automated billing and webhooks
- Customer portal integration
- Usage-based limits enforcement

## Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **AI**: Claude API (Anthropic)
- **File Storage**: Supabase Storage
- **Email**: Resend
- **Styling**: Tailwind CSS + shadcn/ui
- **State Management**: React Query (TanStack Query)
- **OCR**: Claude AI for document text extraction

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Supabase account
- Stripe account
- Anthropic Claude API key
- Resend API key

### Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/yourusername/genealogy-buddy-ai.git
cd genealogy-buddy-ai
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

Edit `.env` with your actual API keys and configuration.

4. Set up the database:

```bash
npx prisma generate
npx prisma db push
```

5. Run the development server:

```bash
npm run dev
```

Visit `http://localhost:3000` to see the application.

## Database Schema

The application uses PostgreSQL with the following main tables:

- **Users** - User accounts and detailed profiles with genealogy-specific fields
- **Subscriptions** - Stripe subscription management with tier-based limits
- **Documents** - Uploaded genealogy documents with OCR text extraction
- **FamilyTrees** - Family tree data structures with individuals and relationships
- **Individuals** - Family tree members with birth/death dates, places, and AI confidence scores
- **Analyses** - AI analysis results for documents, DNA, photos, and research
- **Photos** - Historical photos with metadata, stories, and enhanced versions
- **ResearchChats** - Research copilot conversation history
- **Usage** - Monthly usage tracking by analysis type
- **AuditLogs** - Security and access logging
- **RateLimits** - API rate limiting per user/IP
- **SecurityAlerts** - Abuse detection and security monitoring

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset

### Tools

- `POST /api/tools/dna/analyze` - Interpret DNA data
- `POST /api/tools/tree/expand` - AI tree expansion  
- `POST /api/tools/tree/save` - Save family tree data
- `POST /api/tools/tree/export` - Export family tree to GEDCOM
- `POST /api/tools/research/chat` - Research assistant chat
- `POST /api/tools/photo/analyze` - Photo analysis

### File Management

- `POST /api/upload/document` - Upload and analyze documents
- `POST /api/upload/photo` - Upload photos for analysis
- `GET /api/documents` - List user documents
- `GET /api/photos` - List user photos

### Subscription

- `POST /api/stripe/checkout` - Create checkout session
- `POST /api/stripe/portal` - Access billing portal
- `POST /api/stripe/webhook` - Handle Stripe webhooks

## Deployment

### Vercel Deployment

1. Push your code to GitHub
2. Connect your repository to Vercel
3. Configure environment variables in Vercel dashboard
4. Deploy

### Production Checklist

- [ ] Set up production database with proper indexing
- [ ] Configure Stripe production keys and webhooks
- [ ] Set up Supabase production project with storage buckets
- [ ] Configure Claude AI for document analysis and OCR
- [ ] Set up proper environment variables
- [ ] Configure custom domain with SSL
- [ ] Set up monitoring and analytics
- [ ] Configure rate limiting and abuse protection
- [ ] Set up automated database backups
- [ ] Configure email templates in Resend
- [ ] Set up security alerts and audit logging

## Security Features

- **Authentication**: NextAuth.js with email/password and Google OAuth
- **Authorization**: Role-based access control with subscription tier enforcement
- **Input Validation**: Comprehensive validation using Zod schemas
- **SQL Injection Prevention**: Prisma ORM with parameterized queries
- **XSS Protection**: React's built-in sanitization + CSP headers
- **CSRF Protection**: NextAuth.js built-in protection
- **Password Security**: bcrypt hashing with salt rounds
- **Rate Limiting**: Per-user and per-IP rate limiting on all endpoints
- **Audit Logging**: Comprehensive activity and security event logging
- **File Upload Security**: Type validation, size limits, and secure storage
- **Environment Security**: All sensitive data in environment variables

## Performance Features

- **Image Optimization**: Next.js Image component with automatic optimization
- **Code Splitting**: Dynamic imports and route-based code splitting  
- **Database Optimization**: Prisma query optimization and proper indexing
- **Caching**: React Query for client-side caching and background updates
- **File Processing**: Efficient OCR processing with Claude AI
- **Background Jobs**: Asynchronous processing for heavy AI operations
- **Usage Tracking**: Optimized monthly usage calculations
- **CDN**: Static assets served through Vercel's global CDN

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For support, email support@genealogyai.com or open an issue in the GitHub repository.

## Acknowledgments

- **Anthropic** for Claude AI
- **Vercel** for hosting platform
- **Supabase** for database and storage
- **shadcn/ui** for UI components
- **Anthropic Claude** for AI analysis and OCR
- **Stripe** for payment processing
- All open source contributors

---

Built with ❤️ for genealogy researchers worldwide
