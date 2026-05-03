# Deployment Guide

## Architecture Overview

This project has three parts. Each requires a different hosting strategy:

| Service | Platform | Why |
|---|---|---|
| **Frontend** (React/Vite) | Vercel | Static SPA — perfect fit |
| **PocketBase** | Railway | Needs a persistent filesystem for SQLite + file uploads |
| **API** (Express) | Railway | Long-running Node.js process |

> **Why PocketBase cannot go on Vercel:** Vercel is serverless — every request spins up a fresh container with no persistent disk. PocketBase stores everything in SQLite files (`pb_data/data.db`) and uploaded files on disk. Those would be wiped on every deploy. Use Railway, Render, or Fly.io instead.

---

## Step 1 — Deploy PocketBase on Railway

### 1.1 Create a Dockerfile for PocketBase

Create the file `apps/pocketbase/Dockerfile`:

```dockerfile
FROM alpine:3.19

ARG PB_VERSION=0.36.7

RUN apk add --no-cache unzip ca-certificates wget

ADD https://github.com/pocketbase/pocketbase/releases/download/v${PB_VERSION}/pocketbase_${PB_VERSION}_linux_amd64.zip /tmp/pb.zip
RUN unzip /tmp/pb.zip -d /pb && rm /tmp/pb.zip

COPY pb_migrations /pb/pb_migrations
COPY pb_hooks      /pb/pb_hooks

EXPOSE 8090

CMD ["/pb/pocketbase", "serve", "--http=0.0.0.0:8090", "--dir=/pb/pb_data", "--migrationsDir=/pb/pb_migrations", "--hooksDir=/pb/pb_hooks"]
```

### 1.2 Create a Railway project

1. Go to [railway.app](https://railway.app) → **New Project**
2. Choose **Deploy from GitHub repo** → select your repo
3. Select the **`apps/pocketbase`** directory as the root (Railway detects the Dockerfile automatically)

### 1.3 Add a persistent volume

PocketBase data must survive redeploys:

1. In your Railway service → **Volumes** tab → **Add Volume**
2. Mount path: `/pb/pb_data`
3. This keeps your SQLite database and uploaded files safe across deploys

### 1.4 Set environment variables (optional)

In Railway → **Variables**:

```
PB_ADMIN_EMAIL=your-admin@email.com
PB_ADMIN_PASSWORD=your-secure-password
```

### 1.5 Get your PocketBase URL

After deploy, Railway gives you a public URL like:
```
https://your-app-pocketbase.up.railway.app
```

Save this — you'll need it in the next steps.

### 1.6 Finish PocketBase setup

1. Open `https://your-pocketbase-url.up.railway.app/_/` in your browser
2. Create your superadmin account
3. Your migrations will have run automatically on startup

---

## Step 2 — Deploy the API on Railway

### 2.1 Add a second Railway service

In the same Railway project → **New Service** → **GitHub Repo** → root directory: `apps/api`

### 2.2 Set environment variables

In Railway → **Variables** for the API service:

```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-vercel-frontend.vercel.app
WEBSITE_DOMAIN=https://your-pocketbase-url.up.railway.app
PB_SUPERUSER_EMAIL=your-admin@email.com
PB_SUPERUSER_PASSWORD=your-secure-password
```

### 2.3 Get your API URL

After deploy:
```
https://your-app-api.up.railway.app
```

---

## Step 3 — Update the frontend PocketBase client URL

Currently `apps/web/src/lib/pocketbaseClient.js` hardcodes `/hcgi/platform` for production (a Hostinger-specific path). Change it to use an environment variable:

```js
import Pocketbase from 'pocketbase';

const POCKETBASE_API_URL = import.meta.env.DEV
  ? 'http://127.0.0.1:8090'
  : import.meta.env.VITE_POCKETBASE_URL;

const pocketbaseClient = new Pocketbase(POCKETBASE_API_URL);

export default pocketbaseClient;
export { pocketbaseClient };
```

---

## Step 4 — Deploy the Frontend on Vercel

### 4.1 Add a vercel.json

Create `apps/web/vercel.json`:

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ]
}
```

This tells Vercel to serve `index.html` for all routes so React Router works correctly (replaces the `.htaccess` SPA rule).

### 4.2 Create a Vercel project

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import your GitHub repo
3. Set the **Root Directory** to `apps/web`
4. Vercel auto-detects Vite — framework preset: **Vite**
5. Build command: `npm run build` (or leave default)
6. Output directory: `../../dist/apps/web`

> **Note:** The build script in `package.json` runs an LLM generation step before Vite. If that step fails in CI, change the build command in Vercel to just `npx vite build` to skip it.

### 4.3 Set environment variables in Vercel

In your Vercel project → **Settings** → **Environment Variables**:

```
VITE_POCKETBASE_URL=https://your-pocketbase-url.up.railway.app
```

Set it for **Production**, **Preview**, and **Development** environments.

### 4.4 Deploy

Click **Deploy**. Vercel builds and publishes your frontend.

---

## Step 5 — Update CORS in PocketBase

After deploying the frontend, go to your PocketBase admin panel:

1. Open `https://your-pocketbase-url.up.railway.app/_/`
2. **Settings** → **Application** → set **Application URL** to your Vercel URL

---

## Step 6 — Update CORS in the API

Go back to Railway → API service → **Variables** and update:

```
CORS_ORIGIN=https://your-frontend.vercel.app
```

Redeploy the API service.

---

## Final Environment Variable Summary

### Vercel (Frontend)
```
VITE_POCKETBASE_URL=https://your-pocketbase.up.railway.app
```

### Railway — API service
```
PORT=3001
NODE_ENV=production
CORS_ORIGIN=https://your-frontend.vercel.app
WEBSITE_DOMAIN=https://your-pocketbase.up.railway.app
PB_SUPERUSER_EMAIL=bisadmin@6garage4.com
PB_SUPERUSER_PASSWORD=<your password>
```

### Railway — PocketBase service
No env vars required (uses volume for data persistence).

---

## Local Development (unchanged)

```bash
npm run dev
```

PocketBase still runs locally on `http://127.0.0.1:8090` in development — no changes needed for local workflow.

---

## Checklist

- [ ] `apps/pocketbase/Dockerfile` created
- [ ] PocketBase deployed on Railway with persistent volume mounted at `/pb/pb_data`
- [ ] API deployed on Railway with correct env vars
- [ ] `apps/web/src/lib/pocketbaseClient.js` updated to use `VITE_POCKETBASE_URL`
- [ ] `apps/web/vercel.json` created with SPA rewrite rule
- [ ] Frontend deployed on Vercel with `VITE_POCKETBASE_URL` env var set
- [ ] PocketBase admin panel Application URL updated to Vercel domain
- [ ] API `CORS_ORIGIN` updated to Vercel domain
- [ ] Superadmin account created in PocketBase admin panel (`/_/`)
