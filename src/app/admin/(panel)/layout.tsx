import { requireAdmin } from "@/lib/auth-guard";
import { db } from "@/lib/db";
import { AdminShell } from "@/components/admin/admin-shell";

export const dynamic = "force-dynamic";

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  const unreadMessages = await db.contactMessage.count({ where: { status: "UNREAD" } });

  return (
    <AdminShell
      user={{
        id: user.id,
        name: user.name,
        email: user.email,
        image: user.image,
        profilePhotoUrl: user.profile?.profilePhotoUrl ?? null,
      }}
      unreadMessages={unreadMessages}
    >
      {children}
    </AdminShell>
  );
}
