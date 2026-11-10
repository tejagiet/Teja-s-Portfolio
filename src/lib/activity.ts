import "server-only";

import { db } from "@/lib/db";

type ActivityInput = {
  userId?: string | null;
  action: "CREATE" | "UPDATE" | "DELETE" | "PUBLISH" | "UNPUBLISH" | "LOGIN" | "LOGOUT" | "UPLOAD" | "GENERATE" | "EXPORT" | "SETUP";
  entityType: string;
  entityId?: string | null;
  description: string;
  metadata?: Record<string, unknown>;
};

export async function logActivity(input: ActivityInput) {
  try {
    await db.activityLog.create({
      data: {
        userId: input.userId ?? null,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId ?? null,
        description: input.description,
        metadata: input.metadata ? (input.metadata as object) : undefined,
      },
    });
  } catch (error) {
    console.error("[activity-log]", error);
  }
}
