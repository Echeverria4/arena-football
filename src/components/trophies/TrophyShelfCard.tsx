import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import type { Trophy } from "@/types/trophy";

interface TrophyShelfCardProps {
  trophy: Trophy;
}

export function TrophyShelfCard({ trophy }: TrophyShelfCardProps) {
  return (
    <View
      className="gap-4 rounded-[24px] border p-6 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.01]"
      style={{
        borderColor: "#D3D7DC",
        backgroundColor: "#FAFAFA",
        shadowColor: "#A3A8AF",
        shadowOpacity: 0.12,
        shadowRadius: 18,
      }}
    >
      <View className="h-20 w-20 items-center justify-center rounded-full border border-[#C4C9CF] bg-[#EEF1F3]">
        <Ionicons name="ribbon-outline" size={34} color="#666C74" />
      </View>
      <View className="gap-2">
        <Badge label={trophy.category.replace("_", " ")} tone="gold" />
        <Text className="text-xl font-bold text-[#3F454C]">{trophy.title}</Text>
      </View>
    </View>
  );
}
