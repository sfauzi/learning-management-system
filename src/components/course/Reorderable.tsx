"use client";

import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { Icon } from "@/components/ui/Icon";

type Item = { id: number; content: ReactNode };

/**
 * Drag / long-press reorder.
 *
 * Pointer events are used for mouse, touch and pen so one implementation covers
 * desktop drag, touch drag and stylus input. Listeners live on `window` while a
 * drag is armed: a capture on the handle alone drops events as soon as the
 * pointer moves faster than the element, which silently made dragging a no-op.
 *
 * On touch a 200 ms long-press arms the drag, otherwise the gesture stays a
 * scroll.
 */
export function Reorderable({
  items,
  courseId,
  kind,
  sectionId,
  action,
  label = "Urutan",
  listClassName = "space-y-4",
  handleInside = false,
}: {
  items: Item[];
  courseId: number;
  kind: "sections" | "modules";
  sectionId?: number;
  action: (formData: FormData) => Promise<void>;
  label?: string;
  listClassName?: string;
  handleInside?: boolean;
}) {
  const [order, setOrder] = useState<number[]>(() => items.map((i) => i.id));
  const [dragging, setDragging] = useState<number | null>(null);
  const [saving, startTransition] = useTransition();
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const byId = useMemo(() => new Map(items.map((i) => [i.id, i])), [items]);
  const ids = useMemo(() => items.map((i) => i.id).join(","), [items]);

  const orderRef = useRef(order);
  const containerKey = `${kind}:${sectionId ?? "all"}`;
  useEffect(() => {
    orderRef.current = order;
  }, [order]);

  // a server refresh (item added/removed) resets the local order
  useEffect(() => {
    const fresh = items.map((i) => i.id);
    setOrder(fresh);
    orderRef.current = fresh;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ids]);

  const persist = useCallback(
    (next: number[]) => {
      const fd = new FormData();
      fd.set("course_id", String(courseId));
      if (kind === "modules" && sectionId) fd.set("section_id", String(sectionId));
      fd.set("order", JSON.stringify(next));
      startTransition(async () => {
        await action(fd);
        setSavedAt(Date.now());
      });
    },
    [action, courseId, kind, sectionId]
  );

  const drag = useRef<{
    id: number | null;
    armed: boolean;
    timer: ReturnType<typeof setTimeout> | null;
    startY: number;
  }>({ id: null, armed: false, timer: null, startY: 0 });

  useEffect(() => {
    const onMove = (event: PointerEvent) => {
      const state = drag.current;

      if (!state.armed) {
        // a quick swipe must stay a scroll
        if (state.timer && Math.abs(event.clientY - state.startY) > 8) {
          clearTimeout(state.timer);
          state.timer = null;
        }
        return;
      }
      if (state.id === null) return;

      if (event.cancelable) event.preventDefault();

      const under = document
        .elementFromPoint(event.clientX, event.clientY)
        ?.closest(`[data-sortable-kind="${kind}"]`) as HTMLElement | null;
      if (!under) return;
      // never reorder across containers (a module may not jump between sections)
      if (under.dataset.sortableContainer !== containerKey) return;

      const overId = Number(under.dataset.sortableId);
      if (!Number.isFinite(overId) || overId === state.id) return;

      const current = orderRef.current;
      const from = current.indexOf(state.id);
      const to = current.indexOf(overId);
      if (from === -1 || to === -1) return;

      const next = [...current];
      const [moved] = next.splice(from, 1);
      next.splice(to, 0, moved);
      orderRef.current = next;
      setOrder(next);
    };

    const onUp = () => {
      const state = drag.current;
      if (state.timer) clearTimeout(state.timer);
      state.timer = null;

      if (state.armed) {
        setDragging(null);
        persist(orderRef.current);
      }
      state.armed = false;
      state.id = null;
    };

    window.addEventListener("pointermove", onMove, { passive: false });
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
  }, [kind, persist]);

  useEffect(() => {
    return () => {
      if (drag.current.timer) clearTimeout(drag.current.timer);
    };
  }, []);

  const handlePointerDown = (event: React.PointerEvent, id: number) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    event.preventDefault();

    const state = drag.current;
    if (state.timer) clearTimeout(state.timer);
    state.id = id;
    state.armed = false;
    state.startY = event.clientY;

    if (event.pointerType === "touch" || event.pointerType === "pen") {
      state.timer = setTimeout(() => {
        state.armed = true;
        setDragging(id);
      }, 200);
    } else {
      state.armed = true;
      setDragging(id);
    }
  };

  const dirty = order.join(",") !== items.map((i) => i.id).join(",");

  return (
    <div className="relative">
      <div className="mb-2 flex items-center justify-between text-[11px] text-ink-4">
        <span className="inline-flex items-center gap-1">
          <Icon name="menu" size={12} />
          {label}: seret pegangan untuk mengubah urutan
        </span>
        <span className={saving ? "text-brand" : dirty ? "text-amber-600" : "text-ink-4"}>
          {saving ? "Menyimpan urutan…" : savedAt ? "Urutan tersimpan" : dirty ? "Belum disimpan" : ""}
        </span>
      </div>

      <div className={listClassName}>
        {order.map((id) => {
          const item = byId.get(id);
          if (!item) return null;
          const active = dragging === id;

          return (
            <div
              key={id}
              data-sortable-id={id}
              data-sortable-kind={kind}
              data-sortable-container={containerKey}
              className={`relative transition-shadow ${active ? "z-20 opacity-90 shadow-xl ring-2 ring-brand/40" : ""}`}
            >
              <button
                type="button"
                aria-label="Ubah urutan"
                onPointerDown={(e) => handlePointerDown(e, id)}
                className={`absolute top-3 z-10 cursor-grab touch-none rounded-full border border-[var(--color-line)] bg-white p-1.5 text-ink-3 shadow-sm hover:text-brand active:cursor-grabbing ${
                  handleInside ? "left-1" : "left-0 -translate-x-1/2"
                }`}
                style={{ touchAction: "none" }}
              >
                <Icon name="menu" size={13} />
              </button>
              <div className={active ? "pointer-events-none select-none" : ""}>{item.content}</div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
