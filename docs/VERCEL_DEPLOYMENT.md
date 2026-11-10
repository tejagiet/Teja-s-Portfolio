# Vercel Deployment Guide

This project is fully optimized and configured for **Vercel** serverless deployment with **Neon PostgreSQL** and **Cloudinary CDN**.

---

## 1. Quick Deploy to Vercel

### Step 1: Push Code to GitHub / GitLab / Bitbucket
Ensure all code changes (including `vercel.json` and `prisma/schema.prisma`) are committed and pushed to your Git repository.

### Step 2: Import into Vercel
1. Go to your [Vercel Dashboard](https://vercel.com/dashboard).
2. Click **Add New...** → **Project**.
3. Select your repository and click **Import**.

### Step 3: Configure Build Settings
The repository includes a [vercel.json](../vercel.json) file that pre-configures everything:
- **Framework Preset**: `Next.js`
- **Root Directory**: `./`
- **Build Command**: `prisma generate && next build`
- **Install Command**: `npm install`
- **Region**: `sin1` (Singapore, matching the Neon PostgreSQL database location for lowest latency)

---

## 2. Environment Variables Checklist

In your Vercel Project Settings, navigate to **Settings** → **Environment Variables**, and add the following variables for **Production**, **Preview**, and **Development**:

| Variable | Required | Description / Example |
|---|---|---|
| `DATABASE_URL` | **Yes** | `postgresql://neondb_owner:npg_Lwj8KZeCWO9k@ep-late-art-aojo6jh8-pooler.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require&pgbouncer=true&connect_timeout=15` |
| `DIRECT_URL` | **Yes** | `postgresql://neondb_owner:npg_Lwj8KZeCWO9k@ep-late-art-aojo6jh8.c-2.ap-southeast-1.aws.neon.tech/neondb?sslmode=require` |
| `AUTH_SECRET` | **Yes** | 32+ character random secret (e.g. `fRU9TMV37gEGy2Vwa1hyYLuep6jRouB__CaX8f99Bww`) |
| `AUTH_TRUST_HOST` | **Yes** | `true` (enables dynamic preview URL authentication) |
| `CLOUDINARY_CLOUD_NAME` | **Yes** | `ctdbpfuf` |
| `CLOUDINARY_API_KEY` | **Yes** | `479835148794569` |
| `CLOUDINARY_API_SECRET` | **Yes** | `bJ5zbYOrbMoin5F-mbcPC6YfJIU` |
| `CLOUDINARY_FOLDER` | **Yes** | `teja-portfolio` |
| `IP_HASH_SALT` | **Yes** | Any unique random string |
| `ANALYTICS_SALT` | **Yes** | Any unique random string |
| `NEXT_PUBLIC_SITE_URL` | **Yes** | `https://teja.gietpoly.in` (custom production domain) |
| `AUTH_URL` | **Yes** | `https://teja.gietpoly.in` |
| `RESEND_API_KEY` | *Optional* | Resend API key for transactional email notifications. |
| `PAGESPEED_API_KEY` | *Optional* | Google PageSpeed Insights API key for the admin SEO panel. |

---

## 3. Serverless Architectural Features on Vercel

1. **Prisma Engine Multi-Target Generation**:
   - `prisma/schema.prisma` specifies `binaryTargets = ["native", "rhel-openssl-3.0.x", "debian-openssl-3.0.x"]`.
   - Vercel's Amazon Linux / RHEL serverless containers automatically load the pre-compiled `rhel-openssl-3.0.x` query engine.

2. **PgBouncer Pooling**:
   - Vercel functions scale dynamically and can spawn tens or hundreds of instances during traffic spikes.
   - Using Neon's PgBouncer pooled connection string (`-pooler` host on port 6543) prevents database connection starvation.

3. **Stateless Media via Cloudinary**:
   - Vercel serverless functions have a read-only filesystem (except ephemeral `/tmp`).
   - Image uploads go directly to Cloudinary over HTTPS via `src/lib/cloudinary.ts`.
   - Media delivery is handled by Cloudinary's global edge CDN, keeping Vercel bandwidth low.

4. **Dynamic Metadata & OpenGraph**:
   - Social cards (`/api/og`) and resume PDFs (`/api/resume/download`) run as Node.js serverless functions with zero cold-start bottlenecks.
