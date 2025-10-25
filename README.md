# teraTok

## Project Overview

teraTok is a modern social media platform combining the best of Facebook, Instagram, and Messenger. It features a comprehensive social networking experience with real-time interactions, media sharing, and a robust friend system.

### Features

- **Social Feed**: Personalized feed showing posts from friends with privacy controls
- **Friend System**: Facebook-style mutual friendships with friend requests and accept/reject flow
- **Stories**: Instagram-style ephemeral content that expires after 24 hours
- **Real-time Messaging**: Direct messaging between friends with real-time updates
- **Notifications**: Comprehensive notification system for likes, comments, friend requests, and more
- **User Profiles**: Detailed profiles with bio, cover images, and post history
- **Media Uploads**: Seamless file uploads using UploadThing for images and videos
- **Optimistic UI**: Instant UI updates with background synchronization for smooth user experience

## Tech Stack

### Frontend

- **Next.js 15** with App Router and React Server Components
- **React 19** with hooks and concurrent features
- **Tailwind CSS v4** for styling
- **Shadcn UI** (New York style) for component library
- **React Query** for client-side data fetching with optimistic updates

### Backend

- **tRPC v11** for type-safe API layer with SuperJSON transformer
- **Drizzle ORM** with PostgreSQL (node-postgres driver, snake_case convention)
- **better-auth** for authentication with Discord OAuth (expandable to Google, GitHub)

### Media & Real-time

- **UploadThing** for file uploads and CDN hosting
- **GetStream or Ably** for real-time messaging (to be integrated)
- **Zustand** for client state management (future)

### Development Tools

- **Turborepo** for monorepo management
- **TypeScript** for type safety
- **ESLint & Prettier** for code quality
- **Drizzle Kit** for database migrations

## Getting Started

### Prerequisites

- **Node.js 22+** (required for Next.js 15)
- **pnpm 10+** (package manager)
- **PostgreSQL** database (local or hosted)

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd tera-tok
   ```

2. **Install dependencies**

   ```bash
   pnpm install
   ```

3. **Environment Setup**

   ```bash
   cp .env.example .env
   ```

   Configure the following variables:
   - `POSTGRES_URL`: Your PostgreSQL connection string (Supabase pooler format)
   - `AUTH_SECRET`: Random secret for auth (generate with `openssl rand -base64 32`)
   - `AUTH_DISCORD_ID` & `AUTH_DISCORD_SECRET`: From Discord Developer Portal
   - `UPLOADTHING_TOKEN`: From UploadThing dashboard

4. **Database Setup**

   ```bash
   # Push schema to database
   pnpm db:push

   # Generate auth schema
   pnpm --filter @tera/auth generate
   ```

5. **Development**

   ```bash
   pnpm dev:next
   ```

   The app will be available at http://localhost:3000

## Project Structure

This is a Turborepo monorepo with the following structure:

```
tera-tok/
├── apps/
│   ├── nextjs/          # Main web application (Next.js 15)
│   └── expo/            # Mobile app (React Native, future)
├── packages/
│   ├── api/             # tRPC API layer with routers
│   ├── auth/            # Authentication configuration (better-auth)
│   ├── db/              # Database schemas and client (Drizzle ORM)
│   └── ui/              # Shared UI components (shadcn/ui)
└── tooling/
    ├── eslint/          # Shared ESLint configuration
    ├── prettier/        # Shared Prettier configuration
    ├── tailwind/        # Shared Tailwind theme
    └── typescript/      # Shared TypeScript configuration
```

### Key Directories

- **apps/nextjs**: Web application with pages, components, and API routes
- **packages/api**: tRPC routers for posts, users, feed, messaging, etc.
- **packages/db**: Drizzle schemas for users, posts, friendships, messages, etc.
- **packages/auth**: better-auth configuration with OAuth providers

## Key Features

### Facebook-style Friend System

- Send friend requests to other users
- Accept or reject incoming requests
- Mutual friendships with bidirectional relationships
- Friend-only privacy for posts and profiles

### Privacy Controls

- **Public posts**: Visible to all users
- **Friends-only posts**: Only visible to confirmed friends
- Profile visibility based on friendship status

### Real-time Notifications

- Like notifications on posts
- Comment notifications
- Friend request notifications
- New post notifications from friends
- Message notifications

### Stories (Ephemeral Content)

- 24-hour expiration
- Image and video support
- View tracking (who viewed your stories)
- Friends-only visibility

### Direct Messaging

- One-on-one conversations between friends
- Message history with pagination
- Real-time message delivery (future integration)
- Typing indicators (future)

### Optimistic UI Updates

- Instant feedback for likes, comments, friend requests
- Background synchronization with error handling
- Smooth user experience without loading states

## Development Workflow

### Adding New Features

1. **Database Changes**
   - Update schemas in `packages/db/src/schema-files/`
   - Run `pnpm db:push` to apply changes
   - Update tRPC routers in `packages/api/src/router/`

2. **API Development**
   - Add procedures to relevant tRPC routers
   - Use Zod for input validation
   - Implement proper error handling with TRPCError

3. **UI Components**
   - Add components to `apps/nextjs/src/components/`
   - Use Shadcn UI components as base
   - Implement optimistic updates with React's `useOptimistic`

4. **Pages and Routing**
   - Create pages in `apps/nextjs/src/app/(main)/`
   - Use Server Components for initial data loading
   - Implement Client Components for interactivity

### Database Schema Changes

When modifying database schemas:

```bash
# Edit schema files in packages/db/src/schema-files/
# Then apply changes
pnpm db:push

# Generate updated types
pnpm db:generate
```

### Adding UI Components

Use the interactive shadcn/ui CLI:

```bash
pnpm ui-add
```

This will prompt you to select components to install from the shadcn/ui library.

### UploadThing File Upload Setup

UploadThing is pre-configured for media uploads:

- File routers defined in `apps/nextjs/src/app/api/uploadthing/core.ts`
- Client helpers in `apps/nextjs/src/lib/uploadthing.ts`
- Use `useUploadThing` hook in components for uploads

### Running Tests

Testing infrastructure is planned for future implementation. Currently, manual testing is recommended.

## Deployment

### Prerequisites

- Vercel account for deployment
- Supabase or similar PostgreSQL hosting
- UploadThing account for media storage

### Vercel Deployment

1. **Connect Repository**
   - Import the project on Vercel
   - Set root directory to `apps/nextjs`

2. **Environment Variables**

   ```
   POSTGRES_URL=your_postgres_connection_string
   AUTH_SECRET=your_auth_secret
   AUTH_DISCORD_ID=your_discord_client_id
   AUTH_DISCORD_SECRET=your_discord_client_secret
   UPLOADTHING_TOKEN=your_uploadthing_token
   ```

3. **Database Hosting**
   - Use Supabase for PostgreSQL hosting
   - Update `POSTGRES_URL` with pooler connection string (port 6543)
   - Run migrations: `pnpm db:push`

4. **UploadThing Configuration**
   - Create account at uploadthing.com
   - Get API token and add to environment
   - File routes are pre-configured for images/videos

5. **Deploy**
   - Vercel will automatically deploy on git push
   - Monitor build logs for any issues

### Production Considerations

- **Database**: Use connection pooling for production workloads
- **Media**: UploadThing handles CDN and optimization automatically
- **Auth**: Configure OAuth providers with production URLs
- **Real-time**: Choose between GetStream or Ably for messaging (see below)

## Real-time Integration (Future)

teraTok supports two options for real-time messaging: GetStream and Ably. Choose based on your needs.

### GetStream (Recommended for Chat-focused Apps)

- **Pros**: Pre-built React components, typing indicators, read receipts, moderation tools
- **Cons**: More opinionated, higher cost at scale
- **Best for**: Quick MVP launch with professional chat UI

### Ably (Recommended for Custom Implementations)

- **Pros**: Flexible, general-purpose real-time, better pricing, full customization
- **Cons**: More development work required
- **Best for**: Custom UX requirements, scaling to large user bases

### Integration Guide

See `docs/REALTIME_INTEGRATION.md` for detailed setup instructions once you choose a provider.

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the MIT License.
