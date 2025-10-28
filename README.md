# BSP Feedback Tool 🎯

A comprehensive QR code feedback platform built with Next.js, TypeScript, and Supabase. Collect, analyze, and act on customer feedback efficiently with QR codes, analytics, and multi-tenant SaaS architecture.

![BSP Feedback Tool](https://img.shields.io/badge/Next.js-15-black) ![TypeScript](https://img.shields.io/badge/TypeScript-5-blue) ![Supabase](https://img.shields.io/badge/Supabase-enabled-green) ![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3-blue)

## 🚀 Features

### 📝 **Form Management**
- **Dynamic Form Builder**: Create forms with 5 question types (text, textarea, rating, choice, multiselect)
- **8 Professional Templates**: Restaurant, Retail, Events, Healthcare, Employee Satisfaction, NPS, and more
- **Multi-step Forms**: Support for long surveys with progress tracking
- **Real-time Preview**: Test forms before publishing

### 📱 **QR Code System**
- **Dynamic QR Generation**: Create unique QR codes for each form
- **Location Tracking**: Name and track QR code performance by location
- **Scan Analytics**: Monitor QR code usage and conversion rates
- **Mobile Responsive**: Optimized public submission interface

### 📊 **Analytics & Insights**
- **Comprehensive Dashboard**: Charts, trends, and key metrics
- **Response Analytics**: Track submission patterns and user behavior
- **CSV Export**: Download responses and form structure data
- **Real-time Updates**: Live data refresh and notifications

### 🛡️ **Security & Performance**
- **Rate Limiting**: 10 submissions per 15 minutes per IP
- **Anti-Spam Protection**: Honeypot fields, timing analysis, content filtering
- **CAPTCHA Challenges**: Dynamic verification for suspicious activity
- **GDPR Compliance**: IP hashing and privacy-first data handling

### 🎯 **User Experience**
- **Guided Onboarding**: Step-by-step setup wizard for new users
- **Template Selector**: Search and filter pre-built form templates
- **Plan Management**: Usage tracking with upgrade recommendations
- **Responsive Design**: Works seamlessly on all devices

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

- Node.js 18+
- npm or yarn
- Supabase account

### 1. Clone the repository

```bash
git clone https://github.com/BPenzar/pr_2.git
cd pr_2
```

### 2. Install dependencies

```bash
npm install
```

### 3. Set up environment variables

Copy the example environment file and fill in your Supabase credentials:

```bash
cp .env.example .env.local
```

Add your Supabase configuration:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

### 4. Set up the database

Run the Supabase migrations to create the database schema:

```bash
# If you have Supabase CLI installed
supabase db reset

# Or manually run the migration files in your Supabase dashboard:
# - supabase/migrations/001_initial_schema.sql
# - supabase/migrations/002_rls_policies.sql
# - supabase/migrations/003_functions_and_triggers.sql
# - supabase/migrations/004_materialized_views.sql
# - supabase/seed/001_plans.sql
```

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
│   ├── billing/           # Plan management and billing
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
│   └── upgrade/           # Plan upgrade components
├── hooks/                 # Custom React hooks
├── lib/                   # Utilities and configurations
│   ├── anti-spam.ts       # Anti-spam protection
│   ├── csv-export.ts      # CSV export functionality
│   ├── form-templates.ts  # Pre-built form templates
│   ├── rate-limit.ts      # Rate limiting implementation
│   └── supabase-*.ts      # Supabase client configurations
├── contexts/              # React contexts
└── types/                 # TypeScript type definitions
```

## 🎨 Form Templates

The platform includes 8 professionally designed templates:

1. **Restaurant Feedback** - Comprehensive dining experience survey
2. **Retail Experience** - Shopping and product feedback
3. **Event Feedback** - Conference and workshop evaluation
4. **Employee Satisfaction** - Internal engagement surveys
5. **Patient Experience** - Healthcare service feedback
6. **Simple Product Feedback** - Quick product evaluation
7. **Net Promoter Score (NPS)** - Standard loyalty measurement
8. **Customer Service** - Support interaction evaluation

## 🛡️ Security Features

### Rate Limiting
- **Form Submissions**: 10 submissions per 15 minutes per IP
- **API Requests**: 100 requests per 10 minutes per IP
- **Authentication**: 5 attempts per 5 minutes per IP

### Anti-Spam Protection
- **Honeypot Fields**: Hidden fields to catch bots
- **Timing Analysis**: Detect suspiciously fast submissions
- **Content Filtering**: Identify spam patterns in responses
- **CAPTCHA Challenges**: Dynamic verification when needed

### Data Privacy
- **IP Hashing**: SHA-256 hashing for GDPR compliance
- **RLS Policies**: Row-level security in Supabase
- **Minimal Data Collection**: Only essential information stored

## 📊 Plan Structure

### Free Plan
- 3 projects
- 10 forms per project
- 100 responses per month
- 5 QR codes per form
- Basic analytics
- CSV export

### Pro Plan ($19/month)
- Unlimited projects
- Unlimited forms
- 10,000 responses per month
- Unlimited QR codes
- Advanced analytics
- Custom branding
- Priority support
- API access

### Enterprise Plan (Custom pricing)
- Everything in Pro
- Unlimited responses
- White-label solution
- SSO integration
- Dedicated support
- SLA guarantee

## 🚀 Deployment

### Vercel (Recommended)

1. Connect your GitHub repository to Vercel
2. Add environment variables in Vercel dashboard
3. Deploy automatically on every push to main

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

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

For support, email support@bspfeedback.com or join our Discord community.

## 🙏 Acknowledgments

- Built with [Claude Code](https://claude.com/claude-code)
- UI components from [Radix UI](https://radix-ui.com)
- Charts powered by [Recharts](https://recharts.org)
- Database and authentication by [Supabase](https://supabase.com)

---

**Made with ❤️ by the BSP Feedback Tool team**