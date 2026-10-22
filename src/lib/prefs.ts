import { cookies } from "next/headers";

export const SIDEBAR_COOKIE = "lms_sidebar";

export async function isSidebarCollapsed(): Promise<boolean> {
  const store = await cookies();
  return store.get(SIDEBAR_COOKIE)?.value === "collapsed";
}
