"use server";

import { createHash } from "node:crypto";

import { headers } from "next/headers";

import { logActivity } from "@/lib/activity";
import { db } from "@/lib/db";
import { checkRateLimit } from "@/lib/rate-limit";
import {
  actionError,
  actionSuccess,
  contactSchema,
  fdString,
  zodError,
  type ActionState,
} from "@/lib/validation";
import { revalidatePath } from "next/cache";

function hashIp(ip: string) {
  return createHash("sha256")
    .update(`${process.env.IP_HASH_SALT || "portfolio"}::${ip}`)
    .digest("hex");
}

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

async function sendNotification(input: {
  name: string;
  email: string;
  subject: string;
  message: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_NOTIFICATION_EMAIL;
  if (!apiKey || !to) return;

  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: process.env.CONTACT_FROM_EMAIL || "Portfolio <onboarding@resend.dev>",
        to: [to],
        reply_to: input.email,
        subject: `Portfolio contact: ${input.subject}`,
        text: `Name: ${input.name}\nEmail: ${input.email}\n\n${input.message}`,
        html: `<div style="font-family:Inter,system-ui,sans-serif;line-height:1.6;color:#18181b">
          <h2 style="font-size:18px;margin:0 0 12px">New portfolio message</h2>
          <p style="margin:0 0 4px"><strong>Name:</strong> ${escapeHtml(input.name)}</p>
          <p style="margin:0 0 4px"><strong>Email:</strong> ${escapeHtml(input.email)}</p>
          <p style="margin:0 0 16px"><strong>Subject:</strong> ${escapeHtml(input.subject)}</p>
          <div style="white-space:pre-wrap;border-top:1px solid #e4e4e7;padding-top:16px">${escapeHtml(input.message)}</div>
        </div>`,
      }),
    });
    if (!response.ok) {
      console.error("[contact-email]", await response.text());
    }
  } catch (error) {
    console.error("[contact-email]", error);
  }
}

export async function submitContactMessage(
  _previous: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const honeypot = fdString(formData, "website");
  if (honeypot) {
    // Silently accept so bots do not learn that they were filtered.
    return actionSuccess("Thanks — your message has been received.");
  }

  const parsed = contactSchema.safeParse({
    name: fdString(formData, "name"),
    email: fdString(formData, "email"),
    subject: fdString(formData, "subject"),
    message: fdString(formData, "message"),
    website: "",
    startedAt: fdString(formData, "startedAt"),
  });

  if (!parsed.success) return zodError(parsed.error);

  const startedAt = Number(parsed.data.startedAt ?? 0);
  if (startedAt && Date.now() - startedAt < 1200) {
    return actionSuccess("Thanks — your message has been received.");
  }

  const headerStore = await headers();
  const forwarded = headerStore.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || headerStore.get("x-real-ip") || "unknown";
  const ipHash = hashIp(ip);
  const rate = checkRateLimit(`contact:${ipHash}`, 5, 60 * 60 * 1000);
  if (!rate.allowed) {
    return actionError("Too many messages from this connection. Please try again later.");
  }

  try {
    const message = await db.contactMessage.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        subject: parsed.data.subject,
        message: parsed.data.message,
        ipHash,
        userAgent: headerStore.get("user-agent")?.slice(0, 500) || null,
      },
    });

    await sendNotification(parsed.data);
    await logActivity({
      action: "CREATE",
      entityType: "message",
      entityId: message.id,
      description: `Contact message received from ${parsed.data.name}`,
    });
    revalidatePath("/admin/messages");
    revalidatePath("/admin");

    return actionSuccess("Thanks — your message has been received. I'll get back to you soon.");
  } catch (error) {
    console.error("[contact]", error);
    return actionError("The message could not be sent right now. Please try again shortly.");
  }
}
