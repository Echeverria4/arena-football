import { Ionicons } from "@expo/vector-icons";
import type { ComponentProps } from "react";
import { Pressable, Text, View, useWindowDimensions, type PressableProps } from "react-native";

type PrimaryButtonProps = PressableProps & {
  label: string;
  icon?: ComponentProps<typeof Ionicons>["name"];
  size?: "sm" | "md";
  variant?: "primary" | "secondary" | "light" | "gold" | "danger";
};

export function PrimaryButton({
  label,
  icon,
  size = "md",
  variant = "primary",
  className = "",
  ...rest
}: PrimaryButtonProps) {
  const { width } = useWindowDimensions();
  const isPhone = width < 768;
  const isSmallPhone = width < 420;
  const isCompact = size === "sm";
  const palette =
    variant === "primary"
      ? {
          shell: "bg-[#112018] border-arena-neon/45 shadow-neon",
          inner: "bg-[#153021]",
          shine: "bg-[#57FF7C]/10",
          text: "#F3F7FF",
          icon: "#CFFFD9",
        }
      : variant === "light"
        ? {
            shell: "bg-[#EEF4FF] border-[#3B5BFF]/20",
            inner: "bg-[#F8FAFF]",
            shine: "bg-[#3B5BFF]/8",
            text: "#2447A6",
            icon: "#3150A6",
          }
        : variant === "gold"
          ? {
              shell: "bg-[#FFF2D2] border-[#E9B334]/24",
              inner: "bg-[#FFF8E8]",
              shine: "bg-[#E9B334]/10",
              text: "#8A5B00",
              icon: "#A87507",
            }
          : variant === "danger"
            ? {
                shell: "bg-[#FFF1F3] border-[#D44F62]/22",
                inner: "bg-[#FFF7F8]",
                shine: "bg-[#D44F62]/8",
                text: "#B03348",
                icon: "#C0465B",
              }
            : {
                shell: "bg-[#0E171E] border-arena-line",
                inner: "bg-[#132028]",
                shine: "bg-white/5",
                text: "#F3F7FF",
                icon: "#AEBBDA",
              };

  return (
    <Pressable
      className={`overflow-hidden ${isCompact ? "rounded-[16px]" : "rounded-[18px]"} border active:opacity-85 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.02] ${palette.shell} ${className}`.trim()}
      {...rest}
    >
      <View
        className={`flex-row items-center justify-center gap-2 ${isCompact ? "rounded-[14px] px-4 py-3" : "rounded-[16px] px-5 py-4"} ${palette.inner}`}
        style={{
          minHeight: isCompact
            ? isSmallPhone
              ? 42
              : isPhone
                ? 44
                : 46
            : isSmallPhone
              ? 50
              : isPhone
                ? 54
                : 58,
        }}
      >
        <View
          pointerEvents="none"
          className={`absolute inset-x-4 top-0 h-px rounded-full ${palette.shine}`}
        />

        {icon ? <Ionicons name={icon} size={isPhone ? 16 : 18} color={palette.icon} /> : null}

        <Text
          className="font-semibold uppercase"
          style={{
            color: palette.text,
            fontSize: isCompact ? (isPhone ? 13 : 14) : isPhone ? 14 : 16,
            letterSpacing: isCompact ? (isPhone ? 1 : 1.3) : isPhone ? 1.2 : 1.8,
          }}
        >
          {label}
        </Text>
      </View>
    </Pressable>
  );
}
