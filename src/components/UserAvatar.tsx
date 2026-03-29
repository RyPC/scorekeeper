type Props = {
  username: string;
  avatarUrl: string | null;
  size?: "sm" | "md" | "lg";
};

const sizeClass = {
  sm: "h-10 w-10 text-sm",
  md: "h-14 w-14 text-lg",
  lg: "h-16 w-16 text-xl",
};

export function UserAvatar({ username, avatarUrl, size = "md" }: Props) {
  const initial = username.trim().charAt(0).toUpperCase() || "?";
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={avatarUrl}
        alt=""
        className={`${sizeClass[size]} rounded-full object-cover ring-2 ring-primary/40`}
      />
    );
  }
  return (
    <div
      className={`${sizeClass[size]} flex items-center justify-center rounded-full bg-card font-semibold text-primary ring-2 ring-primary/40`}
      aria-hidden
    >
      {initial}
    </div>
  );
}
