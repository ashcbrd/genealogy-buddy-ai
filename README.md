# GenealogyAI - AI-Powered Family History Research Platform

A comprehensive micro-SaaS application that uses AI to help users discover and document their family history through intelligent document analysis, DNA interpretation, family tree building, and more.

## Features

### 🎯 Five AI-Powered Genealogy Tools

1. **Document Analyzer** - Extract names, dates, places, and relationships from historical documents
2. **DNA Interpreter** - Understand genetic heritage with plain-language explanations
3. **Smart Family Tree Builder** - Build comprehensive family trees with AI suggestions
4. **Research Copilot** - Get expert genealogy guidance from an AI assistant
5. **Photo Storyteller** - Analyze historical photos and generate family narratives

### 💳 Subscription Tiers

- **Free** - 2 documents, 1 tree, 5 research questions
- **Explorer ($19/mo)** - 10 documents, 5 DNA analyses, unlimited research
- **Researcher ($39/mo)** - 50 documents, GEDCOM export, 25 photos
- **Professional ($79/mo)** - Unlimited everything, API access, priority support

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

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js
- **Payments**: Stripe
- **AI**: Claude API (Anthropic)
- **File Storage**: AWS S3
- **Email**: Resend
- **Styling**: Tailwind CSS + shadcn/ui

## Installation

### Prerequisites

- Node.js 18+
- PostgreSQL database
- Stripe account
- Anthropic Claude API key
- AWS S3 bucket
- Resend API key

### Setup Instructions

1. Clone the repository:

```bash
git clone https://github.com/yourusername/genealogy-ai.git
cd genealogy-ai
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

- Users - User accounts and profiles
- Subscriptions - Stripe subscription data
- Documents - Uploaded genealogy documents
- FamilyTrees - Family tree data structures
- Analyses - AI analysis results
- Usage - Monthly usage tracking

## API Endpoints

### Authentication

- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/reset-password` - Password reset

### Tools

- `POST /api/tools/document/analyze` - Analyze documents
- `POST /api/tools/dna/analyze` - Interpret DNA data
- `POST /api/tools/tree/expand` - AI tree expansion
- `POST /api/tools/research/chat` - Research assistant chat
- `POST /api/tools/photo/analyze` - Photo analysis

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

- [ ] Set up production database
- [ ] Configure Stripe production keys
- [ ] Set up AWS S3 bucket with proper permissions
- [ ] Configure custom domain
- [ ] Set up monitoring and analytics
- [ ] Configure rate limiting
- [ ] Set up backup strategy

## Security Best Practices

- All API routes require authentication
- Input validation on all forms
- SQL injection prevention via Prisma
- XSS protection through React
- CSRF protection with NextAuth
- Secure password hashing with bcrypt
- Environment variables for sensitive data

## Performance Optimization

- Image optimization with Next.js Image
- Lazy loading of components
- Database query optimization
- Caching strategies
- CDN for static assets

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

- Anthropic for Claude AI
- Vercel for hosting platform
- shadcn/ui for UI components
- All open source contributors

---

Built with ❤️ for genealogy researchers worldwide
