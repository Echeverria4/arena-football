import { Pressable, Text, type PressableProps } from "react-native";

type PrimaryButtonProps = PressableProps & {
  label: string;
  variant?: "primary" | "secondary";
};

export function PrimaryButton({
  label,
  variant = "primary",
  className = "",
  ...rest
}: PrimaryButtonProps) {
  const base =
    variant === "primary"
      ? "bg-[#112018] border-arena-neon/45 shadow-neon"
      : "bg-[#0E171E] border-arena-line";
  const text = "text-arena-text";

  return (
    <Pressable
      className={`items-center justify-center rounded-2xl border px-5 py-4 active:opacity-80 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02] ${base} ${className}`.trim()}
      {...rest}
    >
      <Text className={`text-lg font-semibold uppercase tracking-[2px] ${text}`}>{label}</Text>
    </Pressable>
  );
}
