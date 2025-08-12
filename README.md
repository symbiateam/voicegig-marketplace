# VoiceGig Marketplace

Professional voice actor marketplace with Stripe Connect payouts and Supabase backend.

## Features

- **Complete Next.js 15 Application** with App Router
- **Real Stripe Connect Integration** for voice actor payouts
- **Supabase Backend** (authentication, database, file storage)
- **shadcn/ui Components** with professional design
- **Live Payout Tracking** and earnings dashboard
- **Job Marketplace** with real file uploads
- **TypeScript, Tailwind CSS, React Hook Form**
- **Platform-agnostic** deployment configuration

## Tech Stack

- **Frontend:** Next.js 15, React, TypeScript, Tailwind CSS
- **UI Components:** shadcn/ui
- **Backend:** Supabase (PostgreSQL, Auth, Storage)
- **Payments:** Stripe Connect
- **Forms:** React Hook Form
- **Deployment:** Netlify, Vercel compatible

## Getting Started

### Prerequisites

- Node.js 18+ or Bun
- Supabase account
- Stripe account with Connect enabled

### Environment Variables

Create `.env.local` file with the following variables:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key

# Stripe
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_stripe_publishable_key
STRIPE_SECRET_KEY=your_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_stripe_webhook_secret

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### Database Setup

1. Create a new Supabase project
2. Run the SQL setup script:

```sql
-- Execute the contents of supabase-setup.sql in your Supabase SQL editor
```

3. Verify setup with the check scripts:

```sql
-- Run check-database-setup.sql to verify tables and policies
-- Run check-setup-simple.sql for a quick verification
```

### Installation

```bash
# Install dependencies
bun install

# Run development server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## Deployment

### Environment Variables for Production

Create `.env.production` with production values:

```env
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=your_production_stripe_key
STRIPE_SECRET_KEY=your_production_stripe_secret_key
STRIPE_WEBHOOK_SECRET=your_production_webhook_secret
NEXT_PUBLIC_APP_URL=https://your-domain.com
```

### Netlify Deployment

The project includes `netlify.toml` configuration:

1. Connect your GitHub repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy automatically on push to main branch

### Vercel Deployment

1. Connect repository to Vercel
2. Set environment variables in Vercel dashboard
3. Deploy with zero configuration

### Manual Deployment

```bash
# Build the application
bun run build

# Start production server
bun start
```

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/               # API routes
│   │   └── stripe/        # Stripe Connect endpoints
│   ├── dashboard/         # Protected dashboard pages
│   ├── login/             # Authentication pages
│   └── signup/
├── components/            # React components
│   └── ui/               # shadcn/ui components
└── lib/                  # Utility functions
    ├── supabase.ts       # Supabase client
    └── utils.ts          # General utilities
```

## Key Features

### Voice Actor Dashboard
- Profile management
- Earnings tracking with Stripe Connect
- Job applications and submissions
- Real-time payout status

### Job Marketplace
- Browse available voice jobs
- Submit audio samples
- Track application status
- File upload capabilities

### Stripe Connect Integration
- Automated payouts to voice actors
- Real-time balance tracking
- Connect account onboarding
- Cashout functionality

### Supabase Backend
- User authentication
- PostgreSQL database
- File storage for audio samples
- Row-level security policies

## Development

### Code Quality

The project uses:
- **Biome** for linting and formatting
- **TypeScript** for type safety
- **ESLint** for additional linting rules

Run quality checks:

```bash
# Lint and format
bun run lint
bun run format

# Type checking
bun run type-check
```

### Database Migrations

When updating the database schema:

1. Update `supabase-setup.sql`
2. Test changes locally
3. Apply to production Supabase instance
4. Run verification scripts

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and quality checks
5. Submit a pull request

## License

Private repository - All rights reserved.

## Support

For questions or issues, please contact the development team or create an issue in this repository.
