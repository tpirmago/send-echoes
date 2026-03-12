# Send Echoes

Write a message, seal it, and choose when it unlocks. A letter to your future self, a goals capsule, or a voice recording — each one stays hidden until the moment you picked.

## What it does

You create an Echo, give it a title and content, then set an unlock date (at least tomorrow — no peeking today). On that date the message becomes readable. Until then it sits sealed in your bottle, waiting.

There are three kinds of Echo:

- **Echo to Myself** — a text letter to your future self
- **Goals Echo** — write down what you want to achieve and come back to it later
- **Voice Echo** — record a voice message or upload an audio file

## Stack

- React 19 + TypeScript + Vite
- Framer Motion — animations and the bottle drop effect
- Supabase — auth, database, file storage
- TanStack Query — data fetching and caching
- React Router — routing

## Getting started

1. Clone the repo and install dependencies:

```bash
npm install
```

2. Create a project at [supabase.com](https://supabase.com), then copy the example env file and fill in your credentials:

```bash
cp .env.example .env
```

3. Run the migration in your Supabase SQL Editor:

```
supabase/migrations/001_init.sql
```

4. In Supabase Auth settings, disable email confirmation (for local dev).

5. Start the dev server:

```bash
npm run dev
```

## Project structure

```
src/
  components/   # GlassBottle, EchoCard, Nav, ProtectedLayout
  context/      # AuthContext
  hooks/        # useEchoes, useCreateEcho
  pages/        # LandingPage, AuthPage, CreateEchoPage, MyEchoesPage, EchoDetailPage
  types/        # Echo types and DB types
  utils/        # Echo config (colors, gradients, labels)
supabase/
  migrations/   # DB schema, RLS policies, triggers
```
