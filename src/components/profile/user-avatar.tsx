import { cn } from "@/lib/cn";

type Props = {
  photoUrl?: string | null;
  email?: string | null;
  name?: string | null;
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  tone?: "light" | "dark";
};

const sizeClass = {
  sm: "size-8 text-[10px]",
  md: "size-10 text-xs",
  lg: "size-16 text-lg",
  xl: "size-24 text-2xl",
} as const;

function initialsFrom(email?: string | null, name?: string | null): string {
  if (name?.trim()) {
    const parts = name.trim().split(/\s+/).slice(0, 2);
    return parts.map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";
  }
  const local = email?.split("@")[0] ?? "?";
  return local.slice(0, 2).toUpperCase();
}

export function UserAvatar({
  photoUrl,
  email,
  name,
  size = "md",
  className,
  tone = "light",
}: Props) {
  const initials = initialsFrom(email, name);

  if (photoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={photoUrl}
        alt=""
        className={cn(
          "shrink-0 rounded-full object-cover ring-2",
          tone === "dark" ? "ring-white/20" : "ring-[var(--color-outline)]",
          sizeClass[size],
          className,
        )}
      />
    );
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full font-bold tracking-wide",
        sizeClass[size],
        tone === "dark"
          ? "bg-white/15 text-white ring-1 ring-white/20"
          : "bg-[linear-gradient(145deg,var(--color-primary),#1a6b52)] text-white",
        className,
      )}
    >
      {initials}
    </span>
  );
}
