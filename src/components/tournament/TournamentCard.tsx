import { Ionicons } from "@expo/vector-icons";
import { Text, View } from "react-native";

import { Badge } from "@/components/ui/Badge";
import { PrimaryButton } from "@/components/ui/PrimaryButton";
import { ScrollRow } from "@/components/ui/ScrollRow";
import { formatDate } from "@/lib/formatters";
import type { Tournament } from "@/types/tournament";

interface TournamentCardAction {
  label: string;
  onPress: () => void;
  variant?: "primary" | "secondary";
}

interface TournamentCardProps {
  tournament: Tournament;
  primaryAction?: TournamentCardAction;
  secondaryAction?: TournamentCardAction;
}

export function TournamentCard({ tournament, primaryAction, secondaryAction }: TournamentCardProps) {
  return (
    <View
      className="rounded-[24px] border p-6 gap-5 transition-transform duration-200 hover:-translate-y-1 hover:scale-[1.01]"
      style={{
        borderColor: "#D3D7DC",
        backgroundColor: "#FAFAFA",
        shadowColor: "#A3A8AF",
        shadowOpacity: 0.12,
        shadowRadius: 18,
      }}
    >
      <View className="flex-row items-start gap-3">
        <View className="h-12 w-12 items-center justify-center rounded-full border border-[#C7CCD1] bg-[#F1F3F5]">
          <Ionicons name="trophy-outline" size={22} color="#646A72" />
        </View>

        <View className="flex-1 gap-2">
          <View className="flex-row items-start justify-between gap-3">
            <View className="flex-1 gap-1">
              <Text className="text-2xl font-semibold text-[#3F454C]">{tournament.name}</Text>
              <Text className="text-base text-[#777D85]">{formatDate(tournament.startDate)}</Text>
            </View>
            <Badge label={tournament.status.replace("_", " ")} tone="neon" />
          </View>

          <Text className="text-base leading-7 text-[#777D85]">{tournament.rules}</Text>
        </View>
      </View>

      <ScrollRow>
        <Badge label={tournament.format.replace("_", " ")} />
        {tournament.allowVideos ? <Badge label="videos" tone="gold" /> : null}
        {tournament.allowGoalAward ? <Badge label="gol bonito" tone="neon" /> : null}
      </ScrollRow>

      {primaryAction || secondaryAction ? (
        <View className="flex-row flex-wrap gap-3">
          {primaryAction ? (
            <PrimaryButton
              label={primaryAction.label}
              onPress={primaryAction.onPress}
              variant={primaryAction.variant ?? "primary"}
              className="min-w-[220px] flex-1 rounded-[20px] py-3.5"
            />
          ) : null}
          {secondaryAction ? (
            <PrimaryButton
              label={secondaryAction.label}
              onPress={secondaryAction.onPress}
              variant={secondaryAction.variant ?? "secondary"}
              className="min-w-[220px] flex-1 rounded-[20px] py-3.5"
            />
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
