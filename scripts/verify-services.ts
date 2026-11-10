import { config } from "dotenv";
config();

import { PrismaClient } from "@prisma/client";

async function main() {
  console.log("\n=======================================================");
  console.log("   Teja Manikanta Portfolio — Cloud Services Diagnostic");
  console.log("   Verifying Neon PostgreSQL & Cloudinary Integration");
  console.log("=======================================================\n");

  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  // 1. Neon Database Check
  console.log("1. Checking PostgreSQL / Neon Database...");
  if (!databaseUrl) {
    console.log("   [FAIL] DATABASE_URL is not set in environment.");
  } else {
    let host = "unknown";
    let isNeon = false;
    let isPooled = false;

    try {
      const parsed = new URL(databaseUrl.replace(/^postgresql:/, "http:"));
      host = parsed.hostname;
      isNeon = host.includes("neon.tech");
      isPooled =
        parsed.searchParams.get("pgbouncer") === "true" ||
        parsed.port === "6543" ||
        host.includes("-pooler");
    } catch {
      isNeon = databaseUrl.includes("neon.tech");
      isPooled = databaseUrl.includes("pgbouncer=true") || databaseUrl.includes("6543");
    }

    const prisma = new PrismaClient({ datasourceUrl: databaseUrl });
    try {
      const start = Date.now();
      await prisma.$queryRawUnsafe("SELECT 1 AS ping");
      const latencyMs = Date.now() - start;

      console.log("   [PASS] Connection: SUCCESS");
      console.log(`   [INFO] Host: ${host}`);
      console.log(`   [INFO] Provider: ${isNeon ? "Neon Serverless PostgreSQL" : "Standard PostgreSQL"}`);
      console.log(`   [INFO] Connection Mode: ${isPooled ? "PgBouncer Pooled (Port 6543)" : "Direct (Port 5432)"}`);
      console.log(`   [INFO] Direct Migration URL: ${directUrl ? "Configured" : "Missing DIRECT_URL (Recommended for Neon migrations)"}`);
      console.log(`   [INFO] Ping Latency: ${latencyMs}ms`);

      const [users, projects, resumes, media] = await Promise.all([
        prisma.user.count().catch(() => 0),
        prisma.project.count().catch(() => 0),
        prisma.resumeVersion.count().catch(() => 0),
        prisma.mediaAsset.count().catch(() => 0),
      ]);

      console.log(`   [DATA] Database Records:`);
      console.log(`          - Users: ${users}`);
      console.log(`          - Projects: ${projects}`);
      console.log(`          - Resume Versions: ${resumes}`);
      console.log(`          - Media Assets: ${media}`);
    } catch (dbErr) {
      console.log(`   [FAIL] Connection Error: ${dbErr instanceof Error ? dbErr.message : String(dbErr)}`);
    } finally {
      await prisma.$disconnect();
    }
  }

  // 2. Cloudinary Media Service Check
  console.log("\n2. Checking Cloudinary Media Storage...");
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    try {
      const auth = Buffer.from(`${apiKey}:${apiSecret}`).toString("base64");
      const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/ping`, {
        method: "GET",
        headers: { Authorization: `Basic ${auth}` },
        signal: AbortSignal.timeout(6000),
      });

      if (res.ok) {
        console.log(`   [PASS] Cloudinary API: SUCCESS`);
        console.log(`   [INFO] Cloud Name: ${cloudName}`);
        console.log(`   [INFO] Folder: ${process.env.CLOUDINARY_FOLDER || "teja-portfolio"}`);
      } else {
        const text = await res.text();
        console.log(`   [FAIL] Cloudinary Error (Status ${res.status}): ${text.slice(0, 120)}`);
      }
    } catch (cldErr) {
      console.log(`   [FAIL] Cloudinary Connection Error: ${cldErr instanceof Error ? cldErr.message : String(cldErr)}`);
    }
  } else {
    console.log(`   [LOCAL] Cloudinary credentials not configured.`);
    console.log(`   [INFO] Mode: Filesystem fallback (.data/uploads) active for development.`);
    console.log(`   [HINT] For production/Neon deployment, set CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET.`);
  }

  // 3. Environment Security Check
  console.log("\n3. Checking Environment Security & Auth...");
  const hasAuth = Boolean(process.env.AUTH_SECRET && process.env.AUTH_SECRET.length >= 32);
  const hasSalt = Boolean(process.env.IP_HASH_SALT && process.env.IP_HASH_SALT !== "change-this-in-production");

  console.log(`   [${hasAuth ? "PASS" : "WARN"}] AUTH_SECRET: ${hasAuth ? "Valid (32+ chars)" : "Weak or missing"}`);
  console.log(`   [${hasSalt ? "PASS" : "WARN"}] IP_HASH_SALT: ${hasSalt ? "Configured" : "Using default/dev salt"}`);

  console.log("\n=======================================================");
  console.log("   Diagnostic Complete.");
  console.log("=======================================================\n");
}

main().catch((err) => {
  console.error("Verification crashed:", err);
  process.exit(1);
});
