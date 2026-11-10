# Neon PostgreSQL & Cloudinary Integration Guide

This guide details the cloud-native database and media architecture for **Teja Manikanta's Portfolio & CMS**, configured specifically for **Neon Serverless PostgreSQL** and **Cloudinary**.

---

## 1. Neon PostgreSQL Architecture

[Neon](https://neon.tech) is a serverless, multi-tenant PostgreSQL database designed for modern web applications. In serverless environments like Vercel and Next.js, traditional long-lived database connections can exhaust connection limits during traffic spikes. Neon solves this with built-in PgBouncer connection pooling and compute autoscaling.

### Dual-Connection Architecture

Prisma and Neon require a two-URL configuration in `prisma/schema.prisma`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

| Environment Variable | Port | Type | Purpose |
| --- | --- | --- | --- |
| `DATABASE_URL` | `6543` | Pooled (PgBouncer) | Used by Next.js Server Actions, Route Handlers and Server Components at runtime. Scales automatically across serverless lambdas. |
| `DIRECT_URL` | `5432` | Direct | Used exclusively by Prisma CLI (`npx prisma migrate deploy`, `npx prisma db push`) to acquire transactional advisory locks and run DDL commands. |

### Configuration Parameters

In `DATABASE_URL`, append these recommended connection flags:

```text
postgresql://USER:PASSWORD@ep-xyz-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15
```

- `sslmode=require`: Enforces encrypted TLS/SSL communication with Neon.
- `pgbouncer=true`: Informs Prisma to prepare queries in transaction pooling mode.
- `connect_timeout=15`: Extends timeout window to gracefully absorb serverless cold starts.

---

## 2. Cloudinary Media Database & CDN

Media assets (profile avatars, project showcase screenshots, certification badges) are stored in [Cloudinary](https://cloudinary.com) with automatic optimization and CDN delivery.

### How It Works

1. **Server-Side REST Uploads**:
   - The browser uploads images via Next.js Server Actions (`uploadMediaAction`).
   - Images are validated server-side (max 8MB, MIME allowlist).
   - Sharp normalizes orientation and resizes high-resolution images up to 2200px.
   - The server signs the upload request using SHA-1 (`timestamp + folder + api_secret`) and dispatches it directly to Cloudinary's REST API.
2. **MediaAsset Records**:
   - Cloudinary returns `secure_url`, `public_id`, `width`, `height`, and `bytes`.
   - A `MediaAsset` record is saved in Neon PostgreSQL.
3. **Automated URL Optimization**:
   - Using `getOptimizedImageUrl(url, options)`, URLs are delivered with `f_auto` (serves modern AVIF/WebP based on client browser support) and `q_auto` (perceptual quality compression).
4. **Lifecycle Cleanup**:
   - Deleting an image in **Admin → Media library** calls `deleteMediaAsset()`, which deletes the asset from Cloudinary CDN via `api.cloudinary.com/v1_1/${cloud}/image/destroy` as well as the database.
5. **Local Fallback**:
   - In local development (`NODE_ENV !== "production"`), if Cloudinary credentials are omitted, the system seamlessly falls back to saving WebP images into `.data/uploads` and serving them via `/api/media/[path]`.

---

## 3. Dedicated Environment File (`.env.neon-cloudinary`)

A pre-configured production template is provided in `.env.neon-cloudinary`:

```bash
# Copy to .env for active testing or copy variables into Vercel:
# Windows PowerShell:
Copy-Item .env.neon-cloudinary .env
```

### Required Variables

```env
# Neon PostgreSQL
DATABASE_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-your-endpoint-pooler.us-east-2.aws.neon.tech/neondb?sslmode=require&pgbouncer=true&connect_timeout=15"
DIRECT_URL="postgresql://neondb_owner:YOUR_PASSWORD@ep-your-endpoint.us-east-2.aws.neon.tech/neondb?sslmode=require"

# Cloudinary
CLOUDINARY_CLOUD_NAME="your-cloud-name"
CLOUDINARY_API_KEY="your-api-key"
CLOUDINARY_API_SECRET="your-api-secret"
CLOUDINARY_FOLDER="teja-portfolio"

# Auth.js
AUTH_SECRET="your-32-byte-random-secret"
AUTH_URL="https://your-domain.com"
NEXT_PUBLIC_SITE_URL="https://your-domain.com"
```

---

## 4. Automated Services Diagnostic CLI

Verify both Neon and Cloudinary connectivity at any time:

```bash
npm run verify:services
```

Output checks:
- [x] Neon database connection & query latency probe.
- [x] Host identification (`*.neon.tech`) and connection mode (Pooled vs Direct).
- [x] Table row counts (Users, Projects, Resume Versions, Media Assets).
- [x] Cloudinary REST API connection & authentication check.
- [x] Fallback mode detection.
- [x] Environment secrets audit.

---

## 5. Deployment Step-by-Step

### Step 1: Initialize Neon Database
1. Create a Neon project at [neon.tech](https://neon.tech).
2. Copy the **Pooled connection** string into `DATABASE_URL`.
3. Copy the **Direct connection** string into `DIRECT_URL`.
4. Deploy the schema:
   ```bash
   npx prisma migrate deploy
   ```
5. Seed the initial content:
   ```bash
   npx prisma db seed
   ```

### Step 2: Configure Cloudinary
1. Create a Cloudinary account at [cloudinary.com](https://cloudinary.com).
2. From the Cloudinary Dashboard, copy `Cloud name`, `API Key`, and `API Secret`.
3. Set `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`.

### Step 3: Deploy to Vercel
1. In Vercel Project Settings → **Environment Variables**, paste all variables from `.env.neon-cloudinary`.
2. Ensure `DATABASE_URL` uses the pooled connection (`-pooler` hostname) and `DIRECT_URL` uses the direct connection.
3. Deploy! Next.js will build using `prisma generate && next build`.
4. Verify in the Admin Dashboard under **Website Settings → Cloud Services Status**.
