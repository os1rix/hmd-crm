const AVATAR_COLORS = [
  "bg-[#2d4a3e] text-[#a8e6cf]",
  "bg-[#3d2d4a] text-[#d4a8e6]",
  "bg-[#4a3d2d] text-[#e6d4a8]",
  "bg-[#2d3d4a] text-[#a8cce6]",
  "bg-[#4a2d3d] text-[#e6a8cc]",
  "bg-[#3d4a2d] text-[#cce6a8]",
];

function colorIndex(name: string): number {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return Math.abs(hash) % AVATAR_COLORS.length;
}

export function UserAvatar({
  name,
  size = "md",
  className = "",
}: {
  name: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
  const color = AVATAR_COLORS[colorIndex(name)];
  const sizeClass =
    size === "sm" ? "h-7 w-7 text-[10px]" : size === "lg" ? "h-10 w-10 text-sm" : "h-8 w-8 text-xs";

  return (
    <div
      className={`flex shrink-0 items-center justify-center font-semibold ${sizeClass} ${color} ${className}`}
      title={name}
    >
      {initials}
    </div>
  );
}
