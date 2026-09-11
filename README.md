# Remixer

A small app for turning a blog draft into other shapes of the same idea — a tighter paragraph, a casual take, a formal version, or a set of tweets — without rewriting it by hand.

## The problem

Writing the post is only half the work. To get any reach, the same argument usually has to show up again as tweets, a shorter recap, or a more conversational version. Doing that manually is slow, easy to over-edit, and easy to drift from what you actually said.

Remixer automates the first pass with Claude: paste the section, pick a style, get a rewrite that keeps your claims and changes the form. Tweets can be saved and opened in Twitter’s composer when you are ready to post.

## What it does

1. Paste the text you want to reuse
2. Pick a remix: Punchier, Casual, Formal, Shorter, Tweet, or Poetic (Kipling-style verse)
3. The app sends it to the Claude API and shows the result
4. Tweet mode returns several standalone posts (at least 3, more for longer input), each in its own box with a Tweet button
5. Save the tweets you want to post later; they appear in a panel on the right and persist in Supabase

## Tech stack

- Next.js (React) and Tailwind
- Claude API (Anthropic)
- Supabase (Postgres) for saved tweets
- Vercel-ready

## Run locally

1. Copy `.env.example` to `.env.local`
2. Add `ANTHROPIC_API_KEY` from the [Anthropic Console](https://console.anthropic.com). A Claude.ai / Max subscription is not an API key.
3. Optionally set `ANTHROPIC_MODEL` (defaults to `claude-haiku-4-5`)
4. Add Supabase keys (see below)
5. `npm install` then `npm run dev`
6. Open http://localhost:3000

## Switch saved tweets to Supabase

Saved tweets used to live in a SQLite file on this computer. They now go to a Supabase table so they survive restarts and can work after you deploy.

### 1. Create a Supabase project

1. Go to [https://supabase.com](https://supabase.com) and sign in
2. Click **New project**
3. Give it a name (for example `remixer`), set a database password, pick a region, wait until it is ready

### 2. Create the `tweets` table

In the project, open **SQL Editor** → **New query**, paste this, and click **Run**:

```sql
create table if not exists tweets (
  id bigint generated always as identity primary key,
  text text not null,
  created_at timestamptz not null default now()
);
```

### 3. Copy the API keys

1. Open **Project Settings** → **API**
2. Copy **Project URL** → that is `SUPABASE_URL`
3. Copy **service_role** (secret) → that is `SUPABASE_SERVICE_ROLE_KEY`

Use the **service_role** key, not the anon key. It stays on the server in `.env.local` and in Vercel env vars. Never put it in the browser or commit it to GitHub.

### 4. Put the keys in `.env.local`

```
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-haiku-4-5
SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

Restart `npm run dev` so Next.js picks up the new values.

### 5. On Vercel later

Add the same four variables in the Vercel project **Settings → Environment Variables**. Do not upload `data/saved.db`; that local SQLite file is no longer used.

## Later ideas

1. A second model (e.g. OpenAI) alongside Claude
2. Upload audio and transcribe it into the paste box
3. Schedule tweets instead of only opening the composer
4. Log in so more than one person can have their own saved list
