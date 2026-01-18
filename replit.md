# Replit.md - Secret Mission System (نظام المهام السري)

## Overview

This is a gamified, invite-only interactive mission system built with a React frontend and Express backend. Users access the system using unique 10-character codes or QR codes, then complete missions/games to earn points, level up, and appear on leaderboards. The system features role-based access with regular users and administrators who can manage codes, missions, and user accounts.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript, using Vite as the build tool
- **Routing**: Wouter for client-side routing with protected route handling
- **State Management**: Zustand for global state (user session, authentication)
- **Data Fetching**: TanStack React Query for server state and caching
- **UI Components**: shadcn/ui component library with Radix UI primitives
- **Styling**: Tailwind CSS with a cyberpunk/dark theme, Arabic fonts (Cairo, Changa)
- **Animations**: Framer Motion for UI transitions

### Backend Architecture
- **Framework**: Express 5 running on Node.js with TypeScript
- **API Design**: RESTful JSON API at `/api/*` endpoints
- **Database ORM**: Drizzle ORM with PostgreSQL dialect
- **Schema Validation**: Zod with drizzle-zod for type-safe validation
- **Build System**: Custom esbuild script for server bundling, Vite for client

### Data Storage
- **Database**: PostgreSQL (requires DATABASE_URL environment variable)
- **Schema Tables**:
  - `users`: id, code (unique access code), name, points, level, role (user/admin), status (active/banned)
  - `missions`: id, title, description, points, type (game/challenge), difficulty, cooldown, repeatable, active, answer
  - `plays`: id, userId, missionId, score (tracks completed missions)

### Mission System
- **Repeatable Missions**: If `repeatable=true`, mission can be replayed after cooldown period expires
- **One-Time Missions**: If `repeatable=false`, mission can only be completed once per user
- **Cooldown Enforcement**: Live countdown timers prevent replay during cooldown period
- **Server-Side Validation**: Backend validates one-time mission status to prevent API abuse

### Authentication
- Code-based authentication (no traditional username/password)
- Users enter a unique 10-character alphanumeric code to access the system
- Session stored in client-side Zustand store
- Role-based access control: regular users vs admins

### Key Design Patterns
- Shared schema definitions between client and server in `/shared/schema.ts`
- Storage abstraction layer in `server/storage.ts` implementing `IStorage` interface
- API client functions in `client/src/lib/api.ts` for type-safe API calls
- Path aliases: `@/` for client source, `@shared/` for shared code

## External Dependencies

### Database
- PostgreSQL database (provisioned via Replit or external)
- Connection via `DATABASE_URL` environment variable

### UI Libraries
- Radix UI primitives (dialog, tabs, select, etc.)
- Lucide React icons
- Embla Carousel for carousels
- date-fns for date formatting (with Arabic locale support)

### Development Tools
- Drizzle Kit for database migrations (`npm run db:push`)
- Vite dev server with HMR
- Replit-specific plugins for development (cartographer, dev-banner, runtime-error-modal)

### Build & Runtime
- esbuild for server bundling
- Vite for client build
- TypeScript for type checking