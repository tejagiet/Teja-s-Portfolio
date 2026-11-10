import "server-only";

import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

export async function getCurrentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      image: true,
      lastLoginAt: true,
      createdAt: true,
      profile: {
        select: {
          displayName: true,
          profilePhotoUrl: true,
          title: true,
        },
      },
    },
  });

  if (!user || user.role !== "ADMIN") return null;
  return user;
}

export async function requireAdmin() {
  const user = await getCurrentUser();
  if (!user) redirect("/admin/login");
  return user;
}

/** Use inside server actions and route handlers where a redirect is not appropriate. */
export async function assertAdmin() {
  const user = await getCurrentUser();
  if (!user) throw new Error("Unauthorized");
  return user;
}
