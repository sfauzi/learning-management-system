import { Icon } from "@/components/ui/Icon";

export function PageHeader({
  title,
  subtitle,
  eyebrow,
  icon = "book",
}: {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  icon?: string;
}) {
  return (
    <div className="border-b border-[var(--color-line-soft)] bg-canvas">
      <div className="container-page py-10">
        <div className="flex items-start gap-4">
          <span className="mt-1 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-white">
            <Icon name={icon} size={22} />
          </span>
          <div>
            {eyebrow && (
              <p className="mb-1 text-[11px] font-bold uppercase tracking-widest text-brand">
                {eyebrow}
              </p>
            )}
            <h1 className="text-2xl font-bold text-ink sm:text-[28px]">{title}</h1>
            {subtitle && <p className="mt-1 max-w-2xl text-sm text-ink-2">{subtitle}</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
