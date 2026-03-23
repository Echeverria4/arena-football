import { View } from "react-native";

interface ProgressBarProps {
  progress: number;
}

export function ProgressBar({ progress }: ProgressBarProps) {
  return (
    <View className="h-3 overflow-hidden rounded-full bg-arena-line">
      <View className="h-full rounded-full bg-arena-neon" style={{ width: `${progress}%` }} />
    </View>
  );
}
