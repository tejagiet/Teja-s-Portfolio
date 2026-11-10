"use server";

import { createHash, timingSafeEqual } from "node:crypto";

import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { logActivity } from "@/lib/activity";
import { signIn, signOut } from "@/lib/auth";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  actionError,
  actionSuccess,
  fdString,
  loginSchema,
  setupSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";
import { safeRedirectPath } from "@/lib/utils";

async function clientIp() {
  const store = await headers();
  const forwarded = store.get("x-forwarded-for");
  return forwarded?.split(",")[0]?.trim() || store.get("x-real-ip") || "unknown";
}

export async function loginAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const parsed = loginSchema.safeParse({
    email: fdString(formData, "email"),
    password: fdString(formData, "password"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const ip = await clientIp();
  const ipLimit = checkRateLimit(`login:ip:${ip}`, 10, 15 * 60 * 1000);
  const emailLimit = checkRateLimit(`login:email:${parsed.data.email}`, 6, 15 * 60 * 1000);
  if (!ipLimit.allowed || !emailLimit.allowed) {
    return actionError("Too many sign-in attempts. Please wait a few minutes and try again.");
  }

  try {
    await signIn("credentials", {
      email: parsed.data.email,
      password: parsed.data.password,
      redirectTo: safeRedirectPath(fdString(formData, "next")),
    });
    return actionSuccess("Signed in.");
  } catch (error) {
    if (error instanceof AuthError) {
      return actionError("Incorrect email or password.");
    }
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/admin/login" });
}

export async function setupAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const existingUsers = await db.user.count();
  if (existingUsers > 0) {
    return actionError("Setup has already been completed. Sign in instead.");
  }

  const expectedToken = process.env.ADMIN_SETUP_TOKEN;
  if (!expectedToken) {
    return actionError("ADMIN_SETUP_TOKEN is not configured. Add it to the environment first.");
  }

  const parsed = setupSchema.safeParse({
    name: fdString(formData, "name"),
    email: fdString(formData, "email"),
    password: fdString(formData, "password"),
    confirm: fdString(formData, "confirm"),
    token: fdString(formData, "token"),
  });
  if (!parsed.success) return zodError(parsed.error);

  const provided = Buffer.from(parsed.data.token);
  const expected = Buffer.from(expectedToken);
  if (
    provided.length !== expected.length ||
    !timingSafeEqual(provided, expected)
  ) {
    return actionError("The setup token is incorrect.");
  }

  try {
    const passwordHash = await bcrypt.hash(parsed.data.password, 12);
    const user = await db.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash,
        role: "ADMIN",
      },
    });

    const profileExists = await db.profile.findFirst();
    if (!profileExists) {
      await db.profile.create({
        data: {
          userId: user.id,
          displayName: parsed.data.name,
          title: "Full-Stack Developer | Software Engineer | Technology Enthusiast",
          shortBio:
            "A software developer focused on building modern web applications, backend systems, database-driven platforms, cloud solutions and integrated software systems.",
          about:
            "This profile was created during initial setup. Use the admin dashboard to add a full introduction, contact details and professional information.",
          interests: [],
        },
      });
    }

    await logActivity({
      userId: user.id,
      action: "SETUP",
      entityType: "workspace",
      description: `Initial admin account created for ${user.email}`,
      metadata: { emailHash: createHash("sha256").update(user.email).digest("hex").slice(0, 12) },
    });

    revalidatePath("/", "layout");

    try {
      await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirectTo: "/admin/profile",
      });
      return actionSuccess("Admin account created.");
    } catch (error) {
      if (error instanceof AuthError) {
        return actionSuccess("Admin account created. Please sign in.");
      }
      throw error;
    }
  } catch (error) {
    console.error("[setup]", error);
    return actionError("The admin account could not be created. Check the server logs.");
  }
}
