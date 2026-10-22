"use server";

import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { SIDEBAR_COOKIE } from "@/lib/prefs";

/**
 * Toggles the app sidebar.
 *
 * The state lives in a cookie (not localStorage) so the server renders the
 * correct width on the first paint — a client-only flag would hydrate expanded
 * and then snap shut on every navigation.
 */
export async function toggleSidebar() {
  const store = await cookies();
  const collapsed = store.get(SIDEBAR_COOKIE)?.value === "collapsed";

  store.set(SIDEBAR_COOKIE, collapsed ? "expanded" : "collapsed", {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
  });

  revalidatePath("/", "layout");
}
