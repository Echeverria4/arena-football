import { Ionicons } from "@expo/vector-icons";
import { Linking, Pressable, Text, View } from "react-native";
import type { PodiumEntry } from "@/lib/championship-history";

const RANK_COLORS = {
  "1º": { medal: "🥇", accentBg: "#F6C54B", accentText: "#0B1328", height: 140 },
  "2º": { medal: "🥈", accentBg: "rgba(255,255,255,0.30)", accentText: "#F3F7FF", height: 100 },
  "3º": { medal: "🥉", accentBg: "rgba(255,255,255,0.18)", accentText: "#F3F7FF", height: 70 },
};

interface PodiumCardProps {
  podium: PodiumEntry[];
  tournamentName?: string;
  seasonLabel?: string;
}

export function PodiumCard({ podium, tournamentName, seasonLabel }: PodiumCardProps) {
  const handleWhatsAppPress = (phone?: string) => {
    if (!phone) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const url = `https://wa.me/${cleanPhone}`;
    Linking.openURL(url);
  };

  const sorted = [...podium].sort((a, b) => {
    const order = { "1º": 0, "2º": 1, "3º": 2 };
    return order[a.rank] - order[b.rank];
  });

  return (
    <View className="gap-4">
      <View className="gap-1">
        <Text
          style={{
            color: "#9AB8FF",
            fontSize: 11,
            fontWeight: "900",
            letterSpacing: 2.4,
            textTransform: "uppercase",
          }}
        >
          Pódio de vencedores
        </Text>
        <Text
          style={{
            color: "#F3F7FF",
            fontSize: 16,
            fontWeight: "800",
          }}
        >
          {tournamentName ?? "Campeonato"}
        </Text>
        {seasonLabel && (
          <Text
            style={{
              color: "#AEBBDA",
              fontSize: 12,
              lineHeight: 18,
            }}
          >
            {seasonLabel}
          </Text>
        )}
      </View>

      <View className="flex-row items-end justify-center gap-4 px-4">
        {sorted.map((entry, index) => {
          const config = RANK_COLORS[entry.rank];
          const isCenter = entry.rank === "1º";

          return (
            <View
              key={entry.rank}
              className="flex-1 items-center gap-3"
              style={{
                transform: isCenter ? [{ scale: 1.1 }] : [],
              }}
            >
              {/* Medal emoji */}
              <Text style={{ fontSize: 32 }}>{config.medal}</Text>

              {/* Podium bar */}
              <View
                style={{
                  width: "100%",
                  height: config.height,
                  borderRadius: 12,
                  backgroundColor: config.accentBg,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.12)",
                }}
              />

              {/* Rank badge */}
              <View
                style={{
                  paddingHorizontal: 8,
                  paddingVertical: 4,
                  borderRadius: 6,
                  backgroundColor: config.accentBg,
                  borderWidth: 1,
                  borderColor: "rgba(255,255,255,0.18)",
                }}
              >
                <Text
                  style={{
                    color: config.accentText,
                    fontSize: 10,
                    fontWeight: "900",
                    letterSpacing: 0.5,
                  }}
                >
                  {entry.rank}
                </Text>
              </View>

              {/* Name and Team */}
              <View className="w-full gap-1">
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#F3F7FF",
                    fontSize: 12,
                    fontWeight: "900",
                    textAlign: "center",
                  }}
                >
                  {entry.playerName}
                </Text>
                <Text
                  numberOfLines={1}
                  style={{
                    color: "#AEBBDA",
                    fontSize: 11,
                    textAlign: "center",
                  }}
                >
                  {entry.teamName}
                </Text>
                <Text
                  style={{
                    color: config.accentBg,
                    fontSize: 10,
                    fontWeight: "900",
                    textAlign: "center",
                    marginTop: 4,
                  }}
                >
                  {entry.points} pts
                </Text>
              </View>

              {/* WhatsApp button */}
              {entry.phone && (
                <Pressable
                  onPress={() => handleWhatsAppPress(entry.phone)}
                  className="flex-row items-center gap-1 rounded-full px-2 py-1"
                  style={{
                    backgroundColor: "rgba(37,211,102,0.20)",
                    borderWidth: 1,
                    borderColor: "rgba(37,211,102,0.40)",
                  }}
                >
                  <Ionicons name="logo-whatsapp" size={14} color="#25D366" />
                  <Text
                    style={{
                      color: "#25D366",
                      fontSize: 9,
                      fontWeight: "700",
                    }}
                  >
                    Contato
                  </Text>
                </Pressable>
              )}
            </View>
          );
        })}
      </View>
    </View>
  );
}
