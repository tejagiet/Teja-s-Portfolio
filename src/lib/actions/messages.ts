"use server";

import { revalidatePath } from "next/cache";

import { assertAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { actionError, actionSuccess, type ActionState } from "@/lib/validation";

function refreshMessagePaths() {
  revalidatePath("/admin/messages");
  revalidatePath("/admin", "layout");
}

export async function toggleMessageReadAction(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const message = await db.contactMessage.findUnique({ where: { id } });
    if (!message) return actionError("That message no longer exists.");

    const read = message.status !== "READ";
    await db.contactMessage.update({
      where: { id },
      data: {
        status: read ? "READ" : "UNREAD",
        readAt: read ? new Date() : null,
      },
    });
    refreshMessagePaths();
    return actionSuccess(read ? "Message marked as read." : "Message marked as unread.");
  } catch (error) {
    console.error("[message-read]", error);
    return actionError("The message status could not be changed.");
  }
}

export async function archiveMessageAction(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const message = await db.contactMessage.findUnique({ where: { id } });
    if (!message) return actionError("That message no longer exists.");

    const archived = message.status !== "ARCHIVED";
    await db.contactMessage.update({
      where: { id },
      data: {
        status: archived ? "ARCHIVED" : "READ",
        readAt: message.readAt ?? new Date(),
      },
    });
    refreshMessagePaths();
    return actionSuccess(archived ? "Message archived." : "Message restored to the inbox.");
  } catch (error) {
    console.error("[message-archive]", error);
    return actionError("The message could not be archived.");
  }
}

export async function deleteMessageAction(id: string): Promise<ActionState> {
  await assertAdmin();
  try {
    const message = await db.contactMessage.findUnique({ where: { id } });
    if (!message) return actionError("That message no longer exists.");

    await db.contactMessage.delete({ where: { id } });
    refreshMessagePaths();
    return actionSuccess("Message deleted.");
  } catch (error) {
    console.error("[message-delete]", error);
    return actionError("The message could not be deleted.");
  }
}
