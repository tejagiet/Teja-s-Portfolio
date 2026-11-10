import { config } from "dotenv";
config();

import { createHash } from "node:crypto";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import { Prisma, PrismaClient } from "@prisma/client";

function signParams(params: Record<string, string | number>, secret: string) {
  const toSign = Object.keys(params)
    .sort()
    .map((key) => `${key}=${params[key]}`)
    .join("&");
  return createHash("sha1").update(`${toSign}${secret}`).digest("hex");
}

async function uploadFileToCloudinary(
  filePath: string,
  cloudName: string,
  apiKey: string,
  apiSecret: string,
  folder: string,
) {
  const buffer = await readFile(filePath);
  const timestamp = Math.floor(Date.now() / 1000);
  const params = { folder, timestamp };
  const signature = signParams(params, apiSecret);

  const body = new FormData();
  body.append("file", new Blob([new Uint8Array(buffer)], { type: "image/webp" }), path.basename(filePath));
  body.append("api_key", apiKey);
  body.append("timestamp", String(timestamp));
  body.append("folder", folder);
  body.append("signature", signature);

  const res = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
    method: "POST",
    body,
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Cloudinary upload failed: ${errorText.slice(0, 150)}`);
  }

  const json = (await res.json()) as {
    secure_url: string;
    public_id: string;
    width: number;
    height: number;
    bytes: number;
  };
  return json;
}

async function main() {
  console.log("\n=======================================================");
  console.log("   Teja Manikanta Portfolio — Cloud Migration Engine");
  console.log("   Migrating to Neon PostgreSQL & Cloudinary CDN");
  console.log("=======================================================\n");

  const localDbUrl =
    process.env.LOCAL_DATABASE_URL ||
    (process.env.DATABASE_URL?.includes("127.0.0.1") || process.env.DATABASE_URL?.includes("localhost")
      ? process.env.DATABASE_URL
      : "postgresql://postgres@127.0.0.1:55432/portfolio?schema=public");

  const targetDbUrl =
    process.env.NEON_DATABASE_URL ||
    (process.env.DATABASE_URL?.includes("neon.tech") ? process.env.DATABASE_URL : null);

  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;
  const folder = process.env.CLOUDINARY_FOLDER || "teja-portfolio";

  console.log(`Source Database: ${localDbUrl.replace(/:[^:@]+@/, ":****@")}`);
  console.log(
    `Target Neon Database: ${targetDbUrl ? targetDbUrl.replace(/:[^:@]+@/, ":****@") : "[NOT CONFIGURED]"}`,
  );
  console.log(`Cloudinary Cloud: ${cloudName || "[NOT CONFIGURED]"}`);
  console.log(`Cloudinary Folder: ${folder}\n`);

  if (!targetDbUrl || !cloudName || !apiKey || !apiSecret) {
    console.log("-------------------------------------------------------");
    console.log("   STATUS: CREDENTIALS REQUIRED FOR CLOUD EXECUTION");
    console.log("-------------------------------------------------------");
    console.log("\nTo complete the cloud migration, please supply:");
    if (!targetDbUrl) {
      console.log("  • NEON_DATABASE_URL: Pooled Neon PostgreSQL connection string");
    }
    if (!cloudName || !apiKey || !apiSecret) {
      console.log("  • CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, and CLOUDINARY_API_SECRET");
    }
    console.log("\nYou can set them in .env, in .env.neon-cloudinary, or pass them inline:");
    console.log("  NEON_DATABASE_URL=\"...\" CLOUDINARY_CLOUD_NAME=\"...\" CLOUDINARY_API_KEY=\"...\" CLOUDINARY_API_SECRET=\"...\" npm run migrate:cloud\n");
    console.log("Scanning local inventory for preparation...\n");
  }

  // 1. Scan local media
  const uploadsDir = path.join(process.cwd(), ".data", "uploads");
  let localFiles: string[] = [];
  try {
    localFiles = await readdir(uploadsDir);
  } catch {
    localFiles = [];
  }
  console.log(`Local media files detected: ${localFiles.length} files in .data/uploads`);

  // 2. Scan local database
  const sourceClient = new PrismaClient({ datasourceUrl: localDbUrl });
  let recordCounts = {
    users: 0,
    profiles: 0,
    projects: 0,
    skills: 0,
    resumes: 0,
    mediaAssets: 0,
  };

  try {
    const [users, profiles, projects, skills, resumes, mediaAssets] = await Promise.all([
      sourceClient.user.count(),
      sourceClient.profile.count(),
      sourceClient.project.count(),
      sourceClient.skill.count(),
      sourceClient.resumeVersion.count(),
      sourceClient.mediaAsset.count(),
    ]);
    recordCounts = { users, profiles, projects, skills, resumes, mediaAssets };
    console.log("Local database inventory:");
    console.log(`  - Users: ${users}`);
    console.log(`  - Profiles: ${profiles}`);
    console.log(`  - Projects: ${projects}`);
    console.log(`  - Skills: ${skills}`);
    console.log(`  - Resume Versions: ${resumes}`);
    console.log(`  - Media Assets: ${mediaAssets}\n`);
  } catch (err) {
    console.log(`Could not connect to source database: ${err instanceof Error ? err.message : String(err)}`);
    await sourceClient.$disconnect();
    return;
  }

  // If cloud credentials are missing, stop at dry-run report
  if (!targetDbUrl || !cloudName || !apiKey || !apiSecret) {
    console.log("Dry-run complete. All local data and media assets are indexed and ready for cloud migration.");
    await sourceClient.$disconnect();
    return;
  }

  // =========================================================================
  // EXECUTION PHASE: Upload media to Cloudinary & transfer data to Neon
  // =========================================================================

  console.log("Starting Cloudinary media upload...");
  const urlMap = new Map<string, { secureUrl: string; publicId: string }>();

  for (const filename of localFiles) {
    const localUrl = `/api/media/${filename}`;
    const filePath = path.join(uploadsDir, filename);
    console.log(`  Uploading ${filename} to Cloudinary...`);
    try {
      const cldResult = await uploadFileToCloudinary(filePath, cloudName, apiKey, apiSecret, folder);
      urlMap.set(localUrl, { secureUrl: cldResult.secure_url, publicId: cldResult.public_id });
      console.log(`    -> Uploaded: ${cldResult.secure_url}`);
    } catch (err) {
      console.warn(`    -> Warning: Failed to upload ${filename}:`, err);
    }
  }

  console.log(`\nMedia upload finished. ${urlMap.size} files migrated to Cloudinary.`);

  // Connect to target Neon DB
  console.log("\nConnecting to Target Neon PostgreSQL database...");
  const targetClient = new PrismaClient({ datasourceUrl: targetDbUrl });

  try {
    await targetClient.$queryRawUnsafe("SELECT 1 AS ping");
    console.log("  Target Neon database ping successful.");
  } catch (neonErr) {
    console.error("  Target Neon database connection failed:", neonErr);
    await sourceClient.$disconnect();
    await targetClient.$disconnect();
    process.exit(1);
  }

  // Export records from source
  console.log("\nExporting records from local database...");
  const [
    users,
    profiles,
    socialLinks,
    skillCategories,
    skills,
    projects,
    projectImages,
    experiences,
    educations,
    certifications,
    services,
    achievements,
    templates,
    resumes,
    resumeSections,
    seoList,
    settings,
    mediaAssets,
  ] = await Promise.all([
    sourceClient.user.findMany(),
    sourceClient.profile.findMany(),
    sourceClient.socialLink.findMany(),
    sourceClient.skillCategory.findMany(),
    sourceClient.skill.findMany(),
    sourceClient.project.findMany(),
    sourceClient.projectImage.findMany(),
    sourceClient.experience.findMany(),
    sourceClient.education.findMany(),
    sourceClient.certification.findMany(),
    sourceClient.service.findMany(),
    sourceClient.achievement.findMany(),
    sourceClient.resumeTemplate.findMany(),
    sourceClient.resumeVersion.findMany(),
    sourceClient.resumeSection.findMany(),
    sourceClient.seoMetadata.findMany(),
    sourceClient.siteSetting.findMany(),
    sourceClient.mediaAsset.findMany(),
  ]);

  const remapUrl = (url: string | null | undefined): string | null => {
    if (!url) return null;
    const match = urlMap.get(url);
    return match ? match.secureUrl : url;
  };

  console.log(`Importing ${users.length} users into Neon...`);
  for (const u of users) {
    await targetClient.user.upsert({
      where: { id: u.id },
      create: { ...u, image: remapUrl(u.image) },
      update: { ...u, image: remapUrl(u.image) },
    });
  }

  console.log(`Importing ${profiles.length} profiles into Neon...`);
  for (const p of profiles) {
    await targetClient.profile.upsert({
      where: { id: p.id },
      create: {
        ...p,
        profilePhotoUrl: remapUrl(p.profilePhotoUrl),
        aboutPhotoUrl: remapUrl(p.aboutPhotoUrl),
      },
      update: {
        ...p,
        profilePhotoUrl: remapUrl(p.profilePhotoUrl),
        aboutPhotoUrl: remapUrl(p.aboutPhotoUrl),
      },
    });
  }

  console.log(`Importing ${socialLinks.length} social links...`);
  for (const sl of socialLinks) {
    await targetClient.socialLink.upsert({
      where: { id: sl.id },
      create: sl,
      update: sl,
    });
  }

  console.log(`Importing ${skillCategories.length} skill categories & ${skills.length} skills...`);
  for (const sc of skillCategories) {
    await targetClient.skillCategory.upsert({
      where: { id: sc.id },
      create: sc,
      update: sc,
    });
  }
  for (const sk of skills) {
    await targetClient.skill.upsert({
      where: { id: sk.id },
      create: sk,
      update: sk,
    });
  }

  console.log(`Importing ${projects.length} projects & ${projectImages.length} images...`);
  for (const pr of projects) {
    await targetClient.project.upsert({
      where: { id: pr.id },
      create: { ...pr, coverImageUrl: remapUrl(pr.coverImageUrl) },
      update: { ...pr, coverImageUrl: remapUrl(pr.coverImageUrl) },
    });
  }
  for (const pi of projectImages) {
    await targetClient.projectImage.upsert({
      where: { id: pi.id },
      create: { ...pi, url: remapUrl(pi.url) || pi.url },
      update: { ...pi, url: remapUrl(pi.url) || pi.url },
    });
  }

  console.log(`Importing experience, education, certifications, services & achievements...`);
  for (const exp of experiences) {
    await targetClient.experience.upsert({ where: { id: exp.id }, create: exp, update: exp });
  }
  for (const edu of educations) {
    await targetClient.education.upsert({ where: { id: edu.id }, create: edu, update: edu });
  }
  for (const cert of certifications) {
    await targetClient.certification.upsert({
      where: { id: cert.id },
      create: { ...cert, imageUrl: remapUrl(cert.imageUrl) },
      update: { ...cert, imageUrl: remapUrl(cert.imageUrl) },
    });
  }
  for (const srv of services) {
    await targetClient.service.upsert({ where: { id: srv.id }, create: srv, update: srv });
  }
  for (const ach of achievements) {
    await targetClient.achievement.upsert({ where: { id: ach.id }, create: ach, update: ach });
  }

  console.log(`Importing ${templates.length} templates & ${resumes.length} resume versions...`);
  for (const tmpl of templates) {
    await targetClient.resumeTemplate.upsert({ where: { id: tmpl.id }, create: tmpl, update: tmpl });
  }
  for (const resVer of resumes) {
    let contentStr = JSON.stringify(resVer.content);
    for (const [localUrl, cld] of urlMap.entries()) {
      contentStr = contentStr.replaceAll(localUrl, cld.secureUrl);
    }
    const remappedContent = JSON.parse(contentStr);

    const resumeData = {
      ...resVer,
      content: remappedContent as Prisma.InputJsonValue,
      config: (resVer.config ?? Prisma.JsonNull) as Prisma.InputJsonValue,
      diff: (resVer.diff ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    };

    await targetClient.resumeVersion.upsert({
      where: { id: resVer.id },
      create: resumeData,
      update: resumeData,
    });
  }
  for (const sec of resumeSections) {
    const secData = {
      ...sec,
      content: (sec.content ?? Prisma.JsonNull) as Prisma.InputJsonValue,
    };
    await targetClient.resumeSection.upsert({ where: { id: sec.id }, create: secData, update: secData });
  }

  console.log(`Importing SEO metadata, settings, and media asset records...`);
  for (const seo of seoList) {
    await targetClient.seoMetadata.upsert({ where: { id: seo.id }, create: seo, update: seo });
  }
  for (const st of settings) {
    await targetClient.siteSetting.upsert({ where: { id: st.id }, create: st, update: st });
  }
  for (const ma of mediaAssets) {
    const mapped = urlMap.get(ma.url);
    await targetClient.mediaAsset.upsert({
      where: { id: ma.id },
      create: {
        ...ma,
        url: mapped ? mapped.secureUrl : ma.url,
        secureUrl: mapped ? mapped.secureUrl : ma.secureUrl,
        publicId: mapped ? mapped.publicId : ma.publicId,
        provider: mapped ? "CLOUDINARY" : ma.provider,
      },
      update: {
        ...ma,
        url: mapped ? mapped.secureUrl : ma.url,
        secureUrl: mapped ? mapped.secureUrl : ma.secureUrl,
        publicId: mapped ? mapped.publicId : ma.publicId,
        provider: mapped ? "CLOUDINARY" : ma.provider,
      },
    });
  }

  console.log("\n=======================================================");
  console.log("   Migration to Neon & Cloudinary SUCCESSFUL! 🚀");
  console.log("=======================================================\n");

  await sourceClient.$disconnect();
  await targetClient.$disconnect();
}

main().catch(async (e) => {
  console.error("Migration failed:", e);
  process.exit(1);
});
