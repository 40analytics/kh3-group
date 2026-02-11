# KHY CRM Dashboard

An AI-Enhanced CRM & Business Performance Dashboard built with **Next.js 16** (App Router) and **NestJS** backend, featuring multi-provider AI support (Anthropic Claude, OpenAI GPT, Google Gemini).

## 🏗️ Architecture

### Frontend: Next.js 16 with App Router
- **Server Components** for optimal performance and SEO
- **App Router** with proper server-side data fetching
- **Client Components** only where needed (interactive UI)
- Tailwind CSS for styling
- Recharts for data visualization

### Backend: NestJS REST API
- **Multi-provider AI service** (Anthropic, OpenAI, Gemini)
- **Prisma ORM** with SQLite (development) / PostgreSQL (production)
- **RESTful API** with TypeScript
- Module-based architecture (Leads, Clients, AI, Admin)

### Key Features
- ✅ Server-side data fetching from backend API
- ✅ Loading and error states for better UX
- ✅ AI provider abstraction with runtime switching
- ✅ Secure API keys (server-side only)
- ✅ Type-safe API client
- ✅ Role-based navigation (CEO, Admin, Sales, Manager)
- ✅ Comprehensive AI insights (Lead Risk, Client Health, Executive Summary)

## 📁 Project Structure

```
KHY CRM Dashboard/
├── backend/                 # NestJS Backend Server
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── seed.ts         # Seed data
│   ├── src/
│   │   ├── ai/             # Multi-provider AI service
│   │   │   ├── providers/  # Anthropic, OpenAI, Gemini
│   │   │   ├── prompts/    # Reusable prompts
│   │   │   └── ai.service.ts
│   │   ├── leads/          # Leads module
│   │   ├── clients/        # Clients module
│   │   ├── admin/          # Admin module
│   │   └── main.ts         # Entry point
│   ├── .env                # Backend config (API keys)
│   └── package.json
│
├── kh3group/               # Next.js 16 Frontend
│   ├── app/
│   │   ├── (dashboard)/
│   │   │   ├── dashboard/page.tsx  # Server Component
│   │   │   ├── leads/page.tsx
│   │   │   ├── clients/page.tsx
│   │   │   ├── admin/page.tsx
│   │   │   └── layout.tsx
│   │   └── layout.tsx      # Root layout (no Context)
│   ├── components/
│   │   ├── layout/         # Client navigation
│   │   ├── dashboard/      # Dashboard components
│   │   ├── leads/          # Leads components
│   │   ├── clients/        # Clients components
│   │   └── admin/          # Admin components
│   ├── lib/
│   │   ├── api/
│   │   │   └── client.ts   # API client layer
│   │   ├── types.ts
│   │   └── constants.ts
│   ├── .env.local          # Frontend config
│   └── package.json
│
└── README.md               # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ installed
- npm or yarn installed

### 1. Install Dependencies

**Backend:**
```bash
cd backend
npm install
```

**Frontend:**
```bash
cd kh3group
npm install
```

### 2. Configure Environment Variables

**Backend** (`.env`):
```env
PORT=4000
DATABASE_URL="file:./dev.db"
AI_DEFAULT_PROVIDER=anthropic

# Add your AI API keys (at least one required)
ANTHROPIC_API_KEY=sk-ant-your-key-here
OPENAI_API_KEY=sk-your-key-here
GEMINI_API_KEY=your-key-here

CORS_ORIGIN=http://localhost:3000
```

**Frontend** (`.env.local`):
```env
NEXT_PUBLIC_API_URL=http://localhost:4000/api
```

### 3. Setup Database

The database migration and seeding will run automatically:
```bash
cd backend
npx prisma generate
npx prisma migrate dev --name init
# Seed data runs automatically after migration
```

This creates:
- 5 sample leads
- 3 sample clients
- 4 users (CEO, Admin, Sales, Manager)
- AI settings

### 4. Start Development Servers

**Terminal 1 - Backend:**
```bash
cd backend
npm run start:dev
# Runs on http://localhost:4000
```

**Terminal 2 - Frontend:**
```bash
cd kh3group
npm run dev
# Runs on http://localhost:3000
```

### 5. Access the Application

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 🎯 Features

### Dashboard
- Revenue metrics and trends
- Pipeline visualization
- Active leads and clients tracking
- AI-generated executive summary

### Leads Management
- Kanban board (New → Contacted → Proposal → Negotiation → Won/Lost)
- AI risk analysis per lead
- Lead details and activity tracking
- Stage transitions with drag-and-drop

### Clients Management
- Client portfolio view
- Health score tracking
- AI-powered health reports
- Upsell strategy recommendations

### Admin Panel
- User management
- AI provider configuration
- System settings
- API key status monitoring

### AI Features
- **Lead Risk Analysis**: Assess deal closure probability
- **Client Health Reports**: Identify at-risk clients
- **Executive Summaries**: High-level business insights
- **Upsell Strategies**: Revenue growth opportunities
- **Multi-Provider Support**: Switch between Anthropic, OpenAI, Gemini

## 🔧 Development

### Backend Commands
```bash
# Development
npm run start:dev

# Build
npm run build

# Production
npm run start:prod

# Database
npx prisma generate        # Generate Prisma Client
npx prisma migrate dev     # Run migrations
npx prisma studio          # Open Prisma Studio
npm run prisma:seed        # Seed database
```

### Frontend Commands
```bash
# Development
npm run dev

# Build
npm run build

# Production
npm run start

# Lint
npm run lint
```

## 🤖 AI Provider Configuration

### Supported Providers

1. **Anthropic Claude** (Recommended)
   - Model: `claude-sonnet-4-5-20250929`
   - Best for: Complex reasoning, detailed analysis
   - Get API key: https://console.anthropic.com/

2. **OpenAI GPT**
   - Model: `gpt-4o`
   - Best for: Structured JSON responses
   - Get API key: https://platform.openai.com/

3. **Google Gemini**
   - Model: `gemini-3-flash-preview`
   - Best for: Fast responses, cost efficiency
   - Get API key: https://ai.google.dev/

### Switching Providers

**Option 1: Environment Variable (Backend)**
```env
AI_DEFAULT_PROVIDER=anthropic  # or 'openai' or 'gemini'
```

**Option 2: Admin Panel (UI)**
- Navigate to Admin → AI Configuration
- Select default provider
- Configure feature-specific providers

**Option 3: Per-Request (API)**
All AI endpoints accept an optional `provider` parameter:
```typescript
api.leads.analyzeRisk(leadId, 'openai');
api.clients.generateHealthReport(clientId, 'gemini');
```

## 📊 API Endpoints

### Leads
```
GET    /api/leads           # List all leads
POST   /api/leads           # Create lead
GET    /api/leads/:id       # Get lead
PATCH  /api/leads/:id       # Update lead
DELETE /api/leads/:id       # Delete lead
POST   /api/leads/:id/analyze  # AI risk analysis
```

### Clients
```
GET    /api/clients         # List all clients
POST   /api/clients         # Create client
GET    /api/clients/:id     # Get client
PATCH  /api/clients/:id     # Update client
DELETE /api/clients/:id     # Delete client
POST   /api/clients/:id/health  # AI health report
POST   /api/clients/:id/upsell  # AI upsell strategy
```

### AI
```
POST   /api/ai/executive-summary  # Generate summary
POST   /api/ai/chat               # AI assistant chat
GET    /api/ai/providers          # Available providers
```

### Admin
```
GET    /api/admin/users           # List users
POST   /api/admin/users           # Create user
PATCH  /api/admin/users/:id       # Update user
GET    /api/admin/ai-settings     # AI configuration
PATCH  /api/admin/ai-settings     # Update AI settings
GET    /api/admin/api-keys/status # API key status
```

## 🛠️ Troubleshooting

### Backend not connecting
- Check if backend is running on port 4000
- Verify `.env` file exists with correct settings
- Check database file exists: `backend/dev.db`

### Frontend showing empty data
- Ensure backend is running first
- Check `NEXT_PUBLIC_API_URL` in `.env.local`
- Check browser console for errors

### AI features not working
- Add at least one AI provider API key to backend `.env`
- Check API key validity in Admin panel
- Verify provider is set in AI settings

### Database errors
- Delete `dev.db` and run `npx prisma migrate dev` again
- Check `DATABASE_URL` in backend `.env`

## 📝 Next Steps

### Production Deployment

1. **Database Migration**: Switch from SQLite to PostgreSQL
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```

2. **Environment Variables**: Set production API keys and URLs

3. **Backend Deployment**: Deploy to Heroku, Railway, or AWS
4. **Frontend Deployment**: Deploy to Vercel or Netlify

### Future Enhancements

- [ ] User authentication (NextAuth.js)
- [ ] Real-time updates (WebSockets)
- [ ] Email notifications
- [ ] Advanced analytics dashboard
- [ ] Mobile app (React Native)
- [ ] API rate limiting
- [ ] Comprehensive test coverage

## 📄 License

MIT License - See LICENSE file for details.

## 🙏 Acknowledgments

- Built with [Next.js 16](https://nextjs.org/)
- Backend powered by [NestJS](https://nestjs.com/)
- Database managed by [Prisma](https://www.prisma.io/)
- AI integrations: [Anthropic](https://www.anthropic.com/), [OpenAI](https://openai.com/), [Google AI](https://ai.google/)

---

**Need help?** Open an issue or contact the development team.
