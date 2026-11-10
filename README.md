# Teja Manikanta — Portfolio & CMS

A production-oriented personal portfolio and management platform for **Teja Manikanta**, built with Next.js App Router, TypeScript, Tailwind CSS, Prisma and PostgreSQL. The public portfolio and every piece of content are managed from a secure admin dashboard, without code changes or redeploys.

The platform deliberately avoids fabricated employment history, qualifications, awards, metrics, testimonials, repository links or screenshots. Content that has not been verified is either omitted or clearly marked as a concept.

---

## Stack

| Area | Technology |
| --- | --- |
| Framework | Next.js `16.4.6` (App Router, Server Actions, Route Handlers) |
| UI | React `19.3.1`, Tailwind CSS `4.3.5`, Framer Motion, Lucide icons, Three.js hero |
| Auth | Auth.js / NextAuth `5.0.0-beta.32` (credentials, JWT sessions, no public registration) |
| Database | PostgreSQL + Prisma `6.19.3` (Neon in production) |
| Media | Cloudinary REST uploads with a local development fallback |
| PDF | Server-side PDF generation with `pdf-lib` + `sharp` |
| Validation | Zod |
| Email | Optional Resend notifications for contact messages |
| Hosting | Vercel |

---

## Features

### Public site

- Hero, about, skills, featured projects, project archive and project detail pages.
- Experience, education, certifications, services, achievements, contact and resume download.
- Light/dark theme with system preference support and persistence.
- Dynamic metadata, canonical URLs, Open Graph and Twitter cards.
- JSON-LD for Person, ProfilePage, WebSite, CreativeWork and BreadcrumbList.
- Dynamic `/sitemap.xml`, `/robots.txt` and Open Graph image (`/api/og`).
- Managed redirects and a custom 404 page.
- First-party page-view analytics plus optional Google Analytics 4.
- Accessible loading, empty and error states.
- Maintenance mode and a public resume-download switch.

### Admin dashboard

- Profile, social links and separate admin/public photos.
- Projects with drafts, publishing, featuring, cover images and gallery images.
- Skills and skill categories.
- Experience, education, certifications, services and achievements.
- Resume builder with version history, live preview, design controls, section order, PDF export, diff, approval and archiving.
- Resume template manager.
- SEO metadata manager, redirect manager, audit and PageSpeed Insights checks.
- Media library with WebP optimization, alt text and folder filters.
- Contact message inbox.
- Website settings, account settings and password changes.
- Activity log for every administrative change.
- Dashboard with real content, analytics, SEO and resume status.

---

## Requirements

- Node.js 20 or newer.
- A PostgreSQL 14+ database. [Neon](https://neon.tech) is recommended for production.
- A Cloudinary account for production uploads. Local development can use the filesystem fallback.
- Optional: Resend API key for contact email notifications.
- Optional: Google PageSpeed Insights API key for higher quota.

---

## Local setup

```bash
# 1. Install dependencies
npm install

# 2. Create the environment file
cp .env.example .env
# Windows PowerShell: Copy-Item .env.example .env

# 3. Fill in DATABASE_URL, AUTH_SECRET, NEXT_PUBLIC_SITE_URL and admin setup values
#    Generate AUTH_SECRET with: openssl rand -base64 32
#    or in PowerShell: [Convert]::ToBase64String((1..32 | % { Get-Random -Max 256 }))

# 4. Apply the schema
npx prisma migrate deploy   # existing migrations
# or, while actively developing the schema:
npx prisma migrate dev

# 5. Seed the initial content and admin account
npx prisma db seed

# 6. Start the app
npm run dev
```

Open:

- Public site: <http://localhost:3000>
- Admin sign in: <http://localhost:3000/admin/login>

The seed reads `ADMIN_EMAIL`, `ADMIN_PASSWORD` and `ADMIN_NAME` from `.env`. If those are not set, seed a deterministic development fallback only after reviewing `prisma/seed.ts`. Never commit real credentials.

### Alternative: one-time setup route

If you prefer to create the admin after deployment:

1. Set `ADMIN_SETUP_TOKEN` to a long random value and deploy.
2. Visit `/admin/setup`, enter the token and create the account.
3. Remove `ADMIN_SETUP_TOKEN` from the environment and redeploy.

The setup route refuses to run once any user exists. There is no public registration route.

### Local media fallback

When Cloudinary is not configured and `NODE_ENV !== "production"`, uploads are optimized to WebP and written to `.data/uploads`, then served from `/api/media/[filename]`. In production, missing Cloudinary credentials cause a clear upload error instead of silently writing to a read-only serverless filesystem.

`.data/` and `.env` are git-ignored.

---

## Environment variables

See [`.env.example`](./.env.example) for the full annotated list.

| Variable | Required | Purpose |
| --- | --- | --- |
| `DATABASE_URL` | Yes | PostgreSQL connection string. Use the pooled Neon URL on Vercel. |
| `AUTH_SECRET` | Yes | Auth.js signing secret. Use at least 32 random bytes. |
| `AUTH_URL` / `NEXTAUTH_URL` | Recommended | Canonical app URL in production. |
| `NEXT_PUBLIC_SITE_URL` | Recommended | Fallback public site URL. The database setting takes precedence once saved. |
| `ADMIN_SETUP_TOKEN` | Setup only | One-time initial admin setup. Remove after use. |
| `ADMIN_EMAIL` / `ADMIN_PASSWORD` / `ADMIN_NAME` | Seed only | Creates the initial admin during `prisma db seed`. |
| `CLOUDINARY_CLOUD_NAME` / `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` | Production | Media uploads. |
| `CLOUDINARY_FOLDER` | Optional | Cloudinary folder prefix. |
| `RESEND_API_KEY` | Optional | Contact-form email notifications. |
| `CONTACT_FROM_EMAIL` / `CONTACT_NOTIFICATION_EMAIL` | Optional | Notification sender and recipient. |
| `PAGESPEED_API_KEY` | Optional | PageSpeed Insights quota. |
| `IP_HASH_SALT` | Recommended | Salt for hashing visitor IPs used by rate limiting. |
| `ANALYTICS_SALT` | Recommended | Salt for anonymous analytics session IDs. |

---

## Neon PostgreSQL

1. Create a Neon project and database.
2. Copy the **pooled** connection string into `DATABASE_URL`.
3. Keep `sslmode=require` (and `pgbouncer=true` when Neon provides it).
4. Run migrations against the direct connection if your provider requires it:

```bash
npx prisma migrate deploy
```

The schema uses standard PostgreSQL types and ICU-independent ordering, so it is portable between Neon, local PostgreSQL and other managed providers.

---

## Cloudinary

1. Create a Cloudinary account and copy the cloud name, API key and API secret.
2. Add them to the environment.
3. Optionally set `CLOUDINARY_FOLDER` (for example `teja-portfolio`).

Uploads are signed server-side over the Cloudinary REST API. Images are converted to WebP, resized to a maximum dimension, and stored with dimensions, format, byte size, folder and alt text. Deleting an asset removes it from Cloudinary as well as the database.

---

## Deployment on Vercel

1. Push the repository to GitHub/GitLab/Bitbucket.
2. Import the repository in Vercel.
3. Add all required environment variables to the Production (and Preview) environment.
4. Use the default build command:

   ```bash
   npm run build
   ```

   `build` runs `prisma generate && next build`.
5. Run migrations as part of your release process:

   ```bash
   npx prisma migrate deploy
   ```

   You can run this once from a local shell against the production database, in a CI step, or in a controlled Vercel build step. Do not use `prisma migrate dev` against production.
6. After the first deployment, set the canonical site URL in **Admin → Website settings** to the real HTTPS domain.
7. Remove `ADMIN_SETUP_TOKEN` from Vercel once the admin account exists.
8. Optionally configure a custom domain in Vercel and update `AUTH_URL`, `NEXTAUTH_URL`, `NEXT_PUBLIC_SITE_URL` and the database site URL.

### Production checklist

- [ ] `AUTH_SECRET` is a unique, random 32+ byte value.
- [ ] `ADMIN_SETUP_TOKEN` is removed after setup.
- [ ] The admin password is unique and stored in a password manager.
- [ ] `DATABASE_URL` uses the pooled Neon connection.
- [ ] Cloudinary credentials are set; no production uploads rely on local disk.
- [ ] The site URL is HTTPS and has no trailing slash.
- [ ] `robots.txt` and `sitemap.xml` resolve on the production domain.
- [ ] A default social image and page metadata are configured.
- [ ] The resume is generated, reviewed and approved.
- [ ] `IP_HASH_SALT` and `ANALYTICS_SALT` are set.
- [ ] Database backups/point-in-time recovery are enabled.

---

## Resume workflow

1. Open **Admin → Resume builder**.
2. Generate a draft from the current published profile, skills, projects, education and experience.
3. Adjust the summary, layout, accent colour, typeface, photo visibility, interests and section order in the live preview.
4. Review the diff against the previously approved resume.
5. Download the PDF to verify it.
6. Click **Approve & publish**. The previous version is archived automatically.
7. The public `/resume` page and `/api/resume/download` now serve the approved version.

When portfolio content changes, the published resume is marked **outdated** and a single auto-generated review draft is kept. The public download continues to serve the approved snapshot until a replacement is published.

Public downloads can be disabled in **Website settings** without deleting the resume.

---

## SEO workflow

**Admin → SEO manager** provides:

- Per-page title, description, keywords, canonical URL, social image and `noindex`.
- Google search-result and social-card previews.
- Managed redirects with 301/302 status and hit counts.
- An audit covering missing metadata, long/short titles and descriptions, duplicate titles, missing alt text, broken internal links, short project descriptions and site configuration.
- PageSpeed Insights checks for mobile and desktop.

The canonical site URL is stored in **Website settings**. Until it is HTTPS, the audit reports a critical issue. This is expected on `localhost`.

---

## Security model

- Only credentials-based admin authentication; no public registration.
- The single admin account is created by seed or the one-time `/admin/setup` route, which locks after the first user.
- Passwords are hashed with bcrypt (cost 12).
- Login attempts are rate limited by IP and email.
- Contact submissions are rate limited, honey-pot checked and timing checked.
- All admin server actions and route handlers call `assertAdmin`.
- Inputs are validated with Zod; uploads are type and size limited server-side.
- Administrative changes are recorded in an append-only activity log.
- Auth.js sessions are signed JWTs stored in secure cookies with an 8-hour lifetime.
- Secrets live only in environment variables and are never rendered in the dashboard.
- The admin UI is excluded from `robots.txt`.

The built-in rate limiter is in-process. On multi-region serverless deployments, use a shared store such as Upstash Redis for hard global limits.

---

## Scripts

| Script | Description |
| --- | --- |
| `npm run dev` | Start the development server. |
| `npm run build` | Generate Prisma Client and create a production build. |
| `npm start` | Start the production server. |
| `npm run typecheck` | Run TypeScript without emitting files. |
| `npm run lint` | Run ESLint. |
| `npm run db:generate` | Regenerate Prisma Client. |
| `npm run db:migrate` | Create/apply a development migration. |
| `npm run db:deploy` | Apply committed migrations in production. |
| `npm run db:seed` | Seed content and the initial admin. |
| `npm run db:studio` | Open Prisma Studio. |
| `npm run db:reset` | Reset the local database and re-run migrations/seed. **Destructive.** |

---

## Project structure

```
prisma/
  schema.prisma            Database models and enums
  migrations/              Committed SQL migrations
  seed.ts                  Initial content, admin, resume and templates
src/
  app/
    (public)/              Public portfolio routes and layout
    admin/                 Admin auth, setup and panel
    api/                   Auth, analytics, media, OG, resume PDF/download
  components/
    admin/                 CMS forms, editors, media tools, resume studio
    public/                Public sections, header/footer, resume document
    ui/                    Shared primitives
  lib/
    actions/               Server actions grouped by module
    auth.ts                Auth.js configuration
    auth-guard.ts          requireAdmin / assertAdmin
    cloudinary.ts          Upload, optimization and local fallback
    resume-engine.ts       Snapshot generation, diffing and approval
    resume-pdf.ts          Server-side PDF generation
    seo-audit.ts           SEO health calculations
    validation.ts          Zod schemas and form helpers
```

---

## Content honesty rules

This project is intentionally conservative:

- Seeded projects are **concept records** with no invented live links, repositories, screenshots or technology claims.
- Experience, certifications and achievements start empty and use factual empty states.
- Social links are seeded hidden placeholders until replaced with real profiles.
- Seed profile contact details use `example.com` placeholders.
- Placeholder content is editable but never fabricated automatically.

When adding real content, verify it first and update the project status only when it is accurate.

---

## Troubleshooting

**`EPERM ... query_engine-windows.dll.node` during build on Windows**  
Stop any running `next dev` / Node processes before `prisma generate` or `npm run build`. Windows locks the Prisma engine DLL while the dev server is running.

**Images fail to upload in production**  
Cloudinary is required in production. Set all three Cloudinary variables and redeploy.

**Resume PDF cannot be generated**  
Ensure the published resume has a valid snapshot and that `sharp` installed correctly for the deployment platform. The PDF route runs on the Node.js runtime.

**SEO audit reports an HTTPS issue locally**  
Expected. Set the production HTTPS URL in **Website settings** before launch.

**PageSpeed Insights rejects the URL**  
It requires a publicly reachable HTTPS URL. Localhost and private domains are rejected by Google.

**Contact emails are not delivered**  
Messages are always stored in the database. Email notifications require `RESEND_API_KEY`, a verified sender and `CONTACT_NOTIFICATION_EMAIL`.

---

## License

Private project. All personal content and branding belong to Teja Manikanta.
