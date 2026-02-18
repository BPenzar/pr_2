# Feedback Collector

QR-code powered feedback collection platform built with Next.js + TypeScript + Supabase. Create projects and forms, generate short-link QR codes, collect responses, and review analytics/exports.

![Feedback Collector](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-enabled-green) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-blue)

## 🚀 Features

### 📝 **Projects & Forms**
- **Projects**: Organize forms per project
- **Form builder**: 5 question types (text, textarea, rating, choice, multiselect)
- **Templates**: Starter library (`src/lib/form-templates.ts`)
- **Preview**: Preview a form before sharing
- **Public multi-step UX**: Long forms show progress and one question per step

### 📱 **QR Code System**
- **Short links**: Public routes under `/f/[shortUrl]`
- **Generation via Supabase Edge Function**: `supabase/functions/generate-qr-code`
- **Location labels**: Track performance per QR placement

### 📊 **Analytics & Insights**
- **Dashboard & charts**: Submission/response insights
- **Response viewer**: Browse responses in-app
- **CSV export**: Export responses and form structure

### 🛡️ **Security & Performance**
- **Rate limiting**: Form submissions (default 10 / 15 minutes per IP)
- **Anti-spam**: Honeypot + timing + content checks
- **CAPTCHA**: Cloudflare Turnstile verification on suspicious submissions
- **Privacy**: IP hashing via `IP_HASH_SALT`

### 🎯 **User Experience**
- **Auth + onboarding**: Signup/login and onboarding flow
- **Legal pages**: `/terms`, `/privacy`, `/dpa`

## 🏗️ Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth
- **Charts**: Recharts
- **QR Codes**: qrcode library
- **UI Components**: Radix UI primitives
- **State Management**: TanStack Query (React Query)

## 🚀 Quick Start

### Prerequisites

- Node.js 20+
- npm
- Supabase (cloud or local via Supabase CLI)

### 1. Clone the repository

```bash
git clone https://github.com/BPenzar/qr-2.git
cd qr-2
```

### 2. Install dependencies

```bash
npm ci
```

### 3. Set up environment variables

Copy the example environment file and fill in your Supabase credentials (required for server routes that use the service role key):

```bash
cp .env.example .env.local
```

Required variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
SUPABASE_URL=your_supabase_project_url
APP_URL=http://localhost:3000
IP_HASH_SALT=your_random_salt_here
NEXT_PUBLIC_TURNSTILE_SITE_KEY=your_turnstile_site_key
TURNSTILE_SECRET_KEY=your_turnstile_secret_key
```

### 4. Set up the database

The schema lives in `supabase/migrations/*` and seed data in `supabase/seed/*`.

If you use Supabase CLI locally:

```bash
supabase start
supabase db reset
supabase status
```

If you use Supabase Cloud, run the SQL migrations in order in the dashboard (or via CI of your choice).

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── auth/              # Authentication pages
│   ├── dashboard/         # Main dashboard
│   ├── forms/             # Form builder and analytics
│   ├── onboarding/        # User onboarding flow
│   └── api/               # API routes
├── components/            # React components
│   ├── analytics/         # Dashboard and analytics components
│   ├── auth/              # Authentication forms
│   ├── forms/             # Form builder components
│   ├── onboarding/        # Onboarding wizard and templates
│   ├── projects/          # Project management
│   ├── public-form/       # Public submission interface
│   ├── qr/                # QR code generation and management
│   ├── ui/                # Reusable UI components
│   └── upgrade/           # Legacy plan components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── anti-spam.ts       # Anti-spam protection
│   ├── csv-export.ts      # CSV export functionality
│   ├── form-templates.ts  # Pre-built form templates
│   ├── rate-limit.ts      # Rate limiting implementation
│   └── supabase-*.ts      # Supabase client configurations
├── contexts/              # React contexts
└── types/                 # TypeScript type definitions
supabase/
├── functions/             # Edge functions (QR generation)
├── migrations/            # Database schema migrations
└── seed/                  # Seed data (plans, defaults)
```

## 🎨 Form Templates

Templates live in `src/lib/form-templates.ts` and are used by onboarding + the “create form” flow.

## 🛡️ Security Features

### Rate Limiting
- **Form Submissions**: 10 submissions per 15 minutes per IP
- **API Requests**: 100 requests per 10 minutes per IP
- **Authentication**: 5 attempts per 5 minutes per IP

### Anti-Spam Protection
- **Honeypot Fields**: Hidden fields to catch bots
- **Timing Analysis**: Detect suspiciously fast submissions
- **Content Filtering**: Identify spam patterns in responses
- **CAPTCHA Challenges**: Turnstile verification when needed

### Data Privacy
- **IP Hashing**: SHA-256 hashing for GDPR compliance
- **RLS Policies**: Row-level security in Supabase
- **Minimal Data Collection**: Only essential information stored

## 🧪 Useful Commands

```bash
npm run dev        # start dev server
npm run lint       # lint
npm run type-check # TypeScript checks
npm run build      # production build
```

## ✅ CI

GitHub Actions runs:
- `npm run lint`
- `npm run type-check`
- `npm run build`

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, `IP_HASH_SALT`, `NEXT_PUBLIC_TURNSTILE_SITE_KEY`, `TURNSTILE_SECRET_KEY`)
3. Deploy automatically on every push to main

For QR generation, the Supabase Edge Function `generate-qr-code` uses `APP_URL` and `SUPABASE_URL` to build the public short link (`/f/[shortUrl]`) and connect to the database.

### Manual Deployment

```bash
# Build the application
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request
