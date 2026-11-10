import { db } from "@/lib/db";

export type DatabaseHealth = {
  configured: boolean;
  ok: boolean;
  isNeon: boolean;
  isPooled: boolean;
  hasDirectUrl: boolean;
  host: string | null;
  latencyMs: number | null;
  metrics?: {
    users: number;
    projects: number;
    resumes: number;
    media: number;
  };
  message: string;
};

export async function verifyDatabaseHealth(): Promise<DatabaseHealth> {
  const databaseUrl = process.env.DATABASE_URL;
  const directUrl = process.env.DIRECT_URL;

  if (!databaseUrl) {
    return {
      configured: false,
      ok: false,
      isNeon: false,
      isPooled: false,
      hasDirectUrl: Boolean(directUrl),
      host: null,
      latencyMs: null,
      message: "DATABASE_URL is not configured in the environment.",
    };
  }

  let host: string | null = null;
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
    // URL parsing fallback
    isNeon = databaseUrl.includes("neon.tech");
    isPooled = databaseUrl.includes("pgbouncer=true") || databaseUrl.includes("6543");
  }

  try {
    const start = Date.now();
    await db.$queryRawUnsafe("SELECT 1 AS ping");
    const latencyMs = Date.now() - start;

    const [users, projects, resumes, media] = await Promise.all([
      db.user.count().catch(() => 0),
      db.project.count().catch(() => 0),
      db.resumeVersion.count().catch(() => 0),
      db.mediaAsset.count().catch(() => 0),
    ]);

    return {
      configured: true,
      ok: true,
      isNeon,
      isPooled,
      hasDirectUrl: Boolean(directUrl),
      host,
      latencyMs,
      metrics: { users, projects, resumes, media },
      message: isNeon
        ? `Connected to Neon PostgreSQL (${isPooled ? "Pooled" : "Direct"}) in ${latencyMs}ms.`
        : `Connected to PostgreSQL (${host || "local"}) in ${latencyMs}ms.`,
    };
  } catch (error) {
    return {
      configured: true,
      ok: false,
      isNeon,
      isPooled,
      hasDirectUrl: Boolean(directUrl),
      host,
      latencyMs: null,
      message: error instanceof Error ? error.message : "Database connection failed.",
    };
  }
}
