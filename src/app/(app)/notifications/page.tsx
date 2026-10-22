import Link from "next/link";
import { notificationsRead } from "@/app/actions/messaging";
import { Icon } from "@/components/ui/Icon";
import { SubmitButton } from "@/components/ui/SubmitButton";
import { requireUser } from "@/lib/auth";
import { db } from "@/lib/supabase/admin";
import { timeAgo } from "@/lib/utils";
import type { Notification } from "@/lib/types";

export const metadata = { title: "Notifications" };

export default async function NotificationsPage() {
  const user = await requireUser();

  const { data } = await db()
    .from("app_notifications")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false })
    .limit(60);

  const list = (data ?? []) as Notification[];
  const unread = list.filter((n) => !n.read_at).length;

  return (
    <div className="mx-auto max-w-[820px]">
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-ink">Notifications</h1>
          <p className="text-sm text-ink-3">{unread} unread</p>
        </div>
        {unread > 0 && (
          <form action={notificationsRead}>
            <SubmitButton className="btn-neutral btn-sm" pendingLabel="…">
              <Icon name="check" size={14} />
              Mark all as read
            </SubmitButton>
          </form>
        )}
      </div>

      <div className="card overflow-hidden">
        <div className="divide-y divide-[var(--color-line-soft)]">
          {list.length === 0 && (
            <p className="px-4 py-5 text-sm text-ink-3">No notifications yet.</p>
          )}
          {list.map((n) => {
            const body = (
              <div className="flex items-start gap-3 px-4 py-3.5">
                <span
                  className={`mt-0.5 inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                    n.read_at ? "bg-soft text-ink-3" : "bg-brand-soft text-brand"
                  }`}
                >
                  <Icon name={n.icon === "bell" ? "bell" : n.icon} size={15} />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13.5px] font-semibold text-ink">{n.title}</p>
                  {n.body && <p className="text-[12.5px] text-ink-2">{n.body}</p>}
                  <p className="mt-0.5 text-[10.5px] text-ink-4">{timeAgo(n.created_at)}</p>
                </div>
                {!n.read_at && <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-brand" />}
              </div>
            );

            return n.url ? (
              <Link key={n.id} href={n.url} className="block hover:bg-soft/50">
                {body}
              </Link>
            ) : (
              <div key={n.id}>{body}</div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
