"use server";

import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

import { logActivity } from "@/lib/activity";
import { assertAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import {
  accountSchema,
  actionError,
  actionSuccess,
  fdString,
  passwordSchema,
  zodError,
  type ActionState,
} from "@/lib/validation";

export async function updateAccountAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();

  const parsed = accountSchema.safeParse({
    name: fdString(formData, "name"),
    email: fdString(formData, "email"),
    image: undefined,
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    const existing = await db.user.findFirst({
      where: { email: parsed.data.email, NOT: { id: user.id } },
      select: { id: true },
    });
    if (existing) return actionError("That email is already used by another account.");

    await db.user.update({
      where: { id: user.id },
      data: { name: parsed.data.name, email: parsed.data.email },
    });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "account",
      entityId: user.id,
      description: "Updated the administrator account",
    });

    revalidatePath("/admin", "layout");
    revalidatePath("/admin/account");
    return actionSuccess("Account details saved.");
  } catch (error) {
    console.error("[account-update]", error);
    return actionError("The account could not be updated.");
  }
}

export async function changePasswordAction(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await assertAdmin();

  const parsed = passwordSchema.safeParse({
    currentPassword: fdString(formData, "currentPassword"),
    newPassword: fdString(formData, "newPassword"),
    confirmPassword: fdString(formData, "confirmPassword"),
  });
  if (!parsed.success) return zodError(parsed.error);

  try {
    const record = await db.user.findUnique({
      where: { id: user.id },
      select: { passwordHash: true },
    });
    if (!record) return actionError("The account could not be found.");

    const valid = await bcrypt.compare(parsed.data.currentPassword, record.passwordHash);
    if (!valid) return actionError("Your current password is incorrect.");

    if (parsed.data.currentPassword === parsed.data.newPassword) {
      return actionError("Choose a password that is different from the current one.");
    }

    const passwordHash = await bcrypt.hash(parsed.data.newPassword, 12);
    await db.user.update({ where: { id: user.id }, data: { passwordHash } });

    await logActivity({
      userId: user.id,
      action: "UPDATE",
      entityType: "account",
      entityId: user.id,
      description: "Changed the administrator password",
    });

    return actionSuccess("Password changed. Use it the next time you sign in.");
  } catch (error) {
    console.error("[account-password]", error);
    return actionError("The password could not be changed.");
  }
}
