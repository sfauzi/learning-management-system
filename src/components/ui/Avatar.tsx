import { initials } from "@/lib/utils";

export function Avatar({
  name,
  src,
  size = 36,
  className = "",
}: {
  name: string | null | undefined;
  src?: string | null;
  size?: number;
  className?: string;
}) {
  if (src) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name ?? "avatar"}
        width={size}
        height={size}
        className={`shrink-0 rounded-full object-cover ${className}`}
        style={{ width: size, height: size }}
      />
    );
  }
  return (
    <span
      className={`inline-flex shrink-0 items-center justify-center rounded-full bg-brand/10 font-semibold text-brand ${className}`}
      style={{ width: size, height: size, fontSize: Math.max(11, size * 0.36) }}
      aria-hidden="true"
    >
      {initials(name)}
    </span>
  );
}
