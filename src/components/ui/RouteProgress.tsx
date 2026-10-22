"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname, useSearchParams } from "next/navigation";

/**
 * Top navigation progress bar.
 *
 * Next.js has no router event hook in the App Router, so progress is inferred:
 * a click on an internal link (or a form submit) starts the bar, and a change of
 * pathname/searchParams finishes it. A safety timer stops the bar if the
 * navigation never resolves (e.g. a same-page anchor).
 */
export function RouteProgress() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);
  const failsafe = useRef<ReturnType<typeof setTimeout> | null>(null);
  const running = useRef(false);

  const clear = () => {
    if (timer.current) clearInterval(timer.current);
    if (failsafe.current) clearTimeout(failsafe.current);
    timer.current = null;
    failsafe.current = null;
  };

  const start = () => {
    if (running.current) return;
    running.current = true;
    clear();
    setVisible(true);
    setProgress(8);
    timer.current = setInterval(() => {
      // ease towards 90% and wait there until the route commits
      setProgress((p) => (p >= 90 ? p : p + Math.max(0.6, (90 - p) / 12)));
    }, 180);
    failsafe.current = setTimeout(finish, 12_000);
  };

  const finish = () => {
    if (!running.current) return;
    running.current = false;
    clear();
    setProgress(100);
    setTimeout(() => {
      setVisible(false);
      setProgress(0);
    }, 260);
  };

  // a committed navigation ends the bar
  useEffect(() => {
    finish();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, searchParams]);

  useEffect(() => {
    const isInternal = (href: string) => {
      if (!href) return false;
      if (href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) return false;
      if (href.startsWith("/")) return true;
      try {
        const url = new URL(href, window.location.href);
        return url.origin === window.location.origin;
      } catch {
        return false;
      }
    };

    const onClick = (event: MouseEvent) => {
      if (event.defaultPrevented || event.button !== 0) return;
      if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;

      const target = event.target as HTMLElement | null;
      const anchor = target?.closest("a");
      if (anchor) {
        const href = anchor.getAttribute("href") ?? "";
        const download = anchor.hasAttribute("download");
        const targetAttr = anchor.getAttribute("target");
        if (download || targetAttr === "_blank" || !isInternal(href)) return;
        const next = new URL(href, window.location.href);
        if (next.pathname === window.location.pathname && next.search === window.location.search) {
          return; // same URL — nothing will load
        }
        start();
        return;
      }

      // router.push / Link inside a clickable div
      if (target?.closest("[data-progress]")) start();
    };

    const onSubmit = (event: Event) => {
      const form = event.target as HTMLFormElement | null;
      if (!form) return;
      // server actions keep the URL, so the bar is stopped by the failsafe
      start();
    };

    document.addEventListener("click", onClick, true);
    document.addEventListener("submit", onSubmit, true);
    return () => {
      document.removeEventListener("click", onClick, true);
      document.removeEventListener("submit", onSubmit, true);
      clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed inset-x-0 top-0 z-[9999] h-[3px]"
      style={{ opacity: visible ? 1 : 0, transition: "opacity 200ms ease" }}
    >
      <div
        className="h-full rounded-r-full bg-brand shadow-[0_0_10px_rgba(161,37,32,0.55)]"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? "width 200ms ease-out" : "width 220ms ease-out",
        }}
      />
    </div>
  );
}
