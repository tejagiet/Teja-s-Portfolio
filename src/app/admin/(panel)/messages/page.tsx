import type { Metadata } from "next";
import Link from "next/link";
import { Archive, ArchiveRestore, Mail, MailOpen } from "lucide-react";

import { ActionButton } from "@/components/admin/action-button";
import { ConfirmDelete } from "@/components/admin/confirm-delete";
import { ListToolbar } from "@/components/admin/collection";
import { PageHeader } from "@/components/admin/page-header";
import { Badge } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import {
  archiveMessageAction,
  deleteMessageAction,
  toggleMessageReadAction,
} from "@/lib/actions/messages";
import { db } from "@/lib/db";
import { formatDateTime, relativeTime, truncate } from "@/lib/utils";

export const metadata: Metadata = { title: "Messages" };

export const dynamic = "force-dynamic";

const STATUS_TABS = [
  { value: "", label: "All" },
  { value: "unread", label: "Unread" },
  { value: "read", label: "Read" },
  { value: "archived", label: "Archived" },
] as const;

export default async function MessagesPage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string; q?: string; message?: string }>;
}) {
  const params = await searchParams;
  const status = params.status || "";
  const q = params.q?.trim() || "";

  const where = {
    ...(status === "unread"
      ? { status: "UNREAD" as const }
      : status === "read"
        ? { status: "READ" as const }
        : status === "archived"
          ? { status: "ARCHIVED" as const }
          : {}),
    ...(q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" as const } },
            { email: { contains: q, mode: "insensitive" as const } },
            { subject: { contains: q, mode: "insensitive" as const } },
            { message: { contains: q, mode: "insensitive" as const } },
          ],
        }
      : {}),
  };

  const [messages, counts, selected] = await Promise.all([
    db.contactMessage.findMany({ where, orderBy: { createdAt: "desc" }, take: 100 }),
    db.contactMessage.groupBy({ by: ["status"], _count: { _all: true } }),
    params.message ? db.contactMessage.findUnique({ where: { id: params.message } }) : null,
  ]);

  const countFor = (value: string) => {
    if (!value) return counts.reduce((sum, entry) => sum + entry._count._all, 0);
    return counts.find((entry) => entry.status === value.toUpperCase())?._count._all ?? 0;
  };

  return (
    <div>
      <PageHeader
        eyebrow="Workspace"
        title="Messages"
        description="Contact submissions are stored in the database even when email notifications are not configured."
      />

      <div className="mb-4 flex flex-wrap gap-1.5">
        {STATUS_TABS.map((tab) => {
          const active = status === tab.value;
          const href = tab.value ? `/admin/messages?status=${tab.value}` : "/admin/messages";
          return (
            <Link
              key={tab.label}
              href={href}
              className={`inline-flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[11px] font-medium transition-colors ${
                active
                  ? "border-accent/30 bg-accent-soft text-foreground"
                  : "border-border bg-card text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
              <span className="rounded-full bg-muted px-1.5 text-[9px] tabular-nums">{countFor(tab.value)}</span>
            </Link>
          );
        })}
      </div>

      <div className={selected ? "grid items-start gap-5 xl:grid-cols-[minmax(0,1fr)_28rem]" : ""}>
        <div>
          <ListToolbar defaultValue={q} placeholder="Search name, email, subject or message…" hidden={status ? [{ name: "status", value: status }] : undefined} />

          {messages.length ? (
            <div className="overflow-hidden rounded-2xl border border-border bg-card">
              <ul className="divide-y divide-border">
                {messages.map((message) => {
                  const active = selected?.id === message.id;
                  return (
                    <li key={message.id}>
                      <Link
                        href={`/admin/messages?message=${message.id}${status ? `&status=${status}` : ""}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
                        className={`flex items-start gap-3 px-4 py-3 transition-colors ${
                          active ? "bg-accent-soft/60" : "hover:bg-muted/40"
                        }`}
                      >
                        <span
                          className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${
                            message.status === "UNREAD" ? "bg-accent" : "bg-border"
                          }`}
                          aria-label={message.status === "UNREAD" ? "Unread" : "Read"}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-xs font-semibold">{message.name}</p>
                            <span className="text-[10px] text-muted-foreground">{message.email}</span>
                            {message.status === "ARCHIVED" ? <Badge tone="neutral">Archived</Badge> : null}
                          </div>
                          <p className="mt-0.5 truncate text-[11px] font-medium">{message.subject}</p>
                          <p className="mt-0.5 truncate text-[10px] text-muted-foreground">
                            {truncate(message.message, 140)}
                          </p>
                        </div>
                        <span className="shrink-0 text-[9px] text-muted-foreground">{relativeTime(message.createdAt)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ) : (
            <EmptyState
              icon="Inbox"
              title={
                q
                  ? "No messages match this search"
                  : status
                    ? `No ${status} messages`
                    : "The inbox is empty"
              }
              description={
                q || status
                  ? "Try clearing the search or choosing another status."
                  : "Messages submitted through the public contact form will appear here."
              }
            />
          )}
        </div>

        {selected ? (
          <section className="overflow-hidden rounded-2xl border border-border bg-card xl:sticky xl:top-20">
            <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
              <div className="min-w-0">
                <p className="text-[9px] uppercase tracking-[0.14em] text-muted-foreground">Message</p>
                <h2 className="mt-0.5 text-sm font-semibold">{selected.subject}</h2>
              </div>
              <Badge tone={selected.status === "UNREAD" ? "accent" : selected.status === "ARCHIVED" ? "neutral" : "success"}>
                {selected.status.toLowerCase()}
              </Badge>
            </div>

            <div className="space-y-3 p-4">
              <div className="rounded-xl bg-muted/40 p-3">
                <p className="text-xs font-medium">{selected.name}</p>
                <a href={`mailto:${selected.email}`} className="text-[11px] text-accent hover:underline">
                  {selected.email}
                </a>
                <p className="mt-1 text-[10px] text-muted-foreground">
                  {formatDateTime(selected.createdAt)}
                  {selected.userAgent ? ` · ${truncate(selected.userAgent, 70)}` : ""}
                </p>
              </div>

              <div className="whitespace-pre-wrap rounded-xl border border-border p-3 text-[11px] leading-relaxed">
                {selected.message}
              </div>

              <div className="flex flex-wrap gap-1.5">
                <a
                  href={`mailto:${selected.email}?subject=${encodeURIComponent(`Re: ${selected.subject}`)}`}
                  className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-accent px-3 text-[11px] font-medium text-accent-foreground"
                >
                  <Mail className="h-3.5 w-3.5" />
                  Reply by email
                </a>
                <ActionButton
                  action={toggleMessageReadAction.bind(null, selected.id)}
                  label={selected.status === "READ" ? "Mark unread" : "Mark read"}
                  icon={
                    selected.status === "READ" ? (
                      <Mail className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <MailOpen className="h-3.5 w-3.5" aria-hidden />
                    )
                  }
                />
                <ActionButton
                  action={archiveMessageAction.bind(null, selected.id)}
                  label={selected.status === "ARCHIVED" ? "Restore" : "Archive"}
                  icon={
                    selected.status === "ARCHIVED" ? (
                      <ArchiveRestore className="h-3.5 w-3.5" aria-hidden />
                    ) : (
                      <Archive className="h-3.5 w-3.5" aria-hidden />
                    )
                  }
                />
                <ConfirmDelete
                  id={selected.id}
                  name="message"
                  action={deleteMessageAction}
                  label="Delete"
                  description="The message will be permanently removed from the database."
                />
              </div>

              <div className="rounded-xl border border-border p-2.5 text-[10px] leading-relaxed text-muted-foreground">
                <p className="font-medium text-foreground">Delivery information</p>
                <p className="mt-1">
                  Stored server-side. IP addresses are hashed for abuse protection. The message is not sent to an
                  external service unless Resend is configured for notifications.
                </p>
              </div>
            </div>
          </section>
        ) : (
          <div className="hidden xl:block">
            <EmptyState
              compact
              icon="Mail"
              title="Select a message"
              description="Choose a message from the list to read it, reply or archive it."
            />
          </div>
        )}
      </div>
    </div>
  );
}
