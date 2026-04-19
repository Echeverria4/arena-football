import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { Pressable, Text, TextInput, useWindowDimensions, View } from "react-native";

// Ordinal abbreviations avoid browser auto-translation ("Seg"→"Segmento", "Sex"→"Sexo")
const WEEKDAYS = ["Dom", "2ª", "3ª", "4ª", "5ª", "6ª", "Sáb"];
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

interface Props {
  currentDeadline?: Date | null;
  onConfirm: (deadline: Date) => void;
  onCancel: () => void;
  onReset: () => void;
}

/** Add N months to (year, month) without any Date overflow. */
function addMonths(year: number, month: number, delta: number): { year: number; month: number } {
  const total = year * 12 + month + delta;
  return { year: Math.floor(total / 12), month: total % 12 };
}

export function DeadlineCalendarPicker({ currentDeadline, onConfirm, onCancel, onReset }: Props) {
  const { width: screenW } = useWindowDimensions();
  const cardWidth = Math.min(316, screenW - 40);

  // Reference date: today at midnight (no Date overflow tricks)
  const now = new Date();
  const todayYear = now.getFullYear();
  const todayMonth = now.getMonth();
  const todayDay = now.getDate();
  const todayMidnight = new Date(todayYear, todayMonth, todayDay);

  // Navigation bounds: today's month ↔ 2 months ahead (integer arithmetic, zero overflow)
  const minKey = todayYear * 12 + todayMonth;
  const maxBound = addMonths(todayYear, todayMonth, 2);
  const maxKey = maxBound.year * 12 + maxBound.month;

  // Open on the current-deadline's month if it's still in the future, else on today's month
  const initDeadline = currentDeadline && currentDeadline >= todayMidnight ? currentDeadline : null;
  const initYear = initDeadline ? initDeadline.getFullYear() : todayYear;
  const initMonth = initDeadline ? initDeadline.getMonth() : todayMonth;

  const [viewYear, setViewYear] = useState(initYear);
  const [viewMonth, setViewMonth] = useState(initMonth);
  const [selectedDate, setSelectedDate] = useState<Date | null>(initDeadline);
  const [timeInput, setTimeInput] = useState(
    initDeadline
      ? `${String(initDeadline.getHours()).padStart(2, "0")}:${String(initDeadline.getMinutes()).padStart(2, "0")}`
      : "20:00",
  );

  const viewKey = viewYear * 12 + viewMonth;
  const canGoPrev = viewKey > minKey;
  const canGoNext = viewKey < maxKey;

  function goPrev() {
    if (!canGoPrev) return;
    const prev = addMonths(viewYear, viewMonth, -1);
    setViewYear(prev.year);
    setViewMonth(prev.month);
  }
  function goNext() {
    if (!canGoNext) return;
    const next = addMonths(viewYear, viewMonth, 1);
    setViewYear(next.year);
    setViewMonth(next.month);
  }

  // Build calendar grid (Sunday-first)
  const firstWeekday = new Date(viewYear, viewMonth, 1).getDay(); // 0=Sun
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const prevMonthDays = new Date(viewYear, viewMonth, 0).getDate();

  type Cell = { date: Date; inMonth: boolean; disabled: boolean };
  const cells: Cell[] = [];

  for (let i = firstWeekday - 1; i >= 0; i--) {
    cells.push({ date: new Date(viewYear, viewMonth - 1, prevMonthDays - i), inMonth: false, disabled: true });
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const date = new Date(viewYear, viewMonth, d);
    cells.push({ date, inMonth: true, disabled: date < todayMidnight });
  }
  for (let d = 1; cells.length < 42; d++) {
    cells.push({ date: new Date(viewYear, viewMonth + 1, d), inMonth: false, disabled: true });
  }

  function parseTime(s: string): { h: number; m: number } | null {
    const match = s.match(/^(\d{1,2}):(\d{2})$/);
    if (!match) return null;
    const h = Number(match[1]);
    const m = Number(match[2]);
    if (h > 23 || m > 59) return null;
    return { h, m };
  }

  const parsedTime = parseTime(timeInput);
  const canConfirm = Boolean(selectedDate && parsedTime);

  function isSelected(d: Date) {
    return Boolean(
      selectedDate &&
      d.getFullYear() === selectedDate.getFullYear() &&
      d.getMonth() === selectedDate.getMonth() &&
      d.getDate() === selectedDate.getDate(),
    );
  }
  function isToday(d: Date) {
    return d.getDate() === todayDay && d.getMonth() === todayMonth && d.getFullYear() === todayYear;
  }

  function handleConfirm() {
    if (!selectedDate || !parsedTime) return;
    const dl = new Date(selectedDate);
    dl.setHours(parsedTime.h, parsedTime.m, 0, 0);
    onConfirm(dl);
  }

  const cellSize = Math.floor((cardWidth - 24) / 7);

  return (
    <View
      style={{
        width: cardWidth,
        backgroundColor: "#0D1829",
        borderRadius: 20,
        padding: 12,
        borderWidth: 1,
        borderColor: "rgba(59,130,246,0.28)",
        shadowColor: "#3B5BFF",
        shadowOpacity: 0.25,
        shadowRadius: 24,
        shadowOffset: { width: 0, height: 6 },
      }}
    >
      {/* Month navigation */}
      <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <Pressable onPress={goPrev} disabled={!canGoPrev} style={{ padding: 8, opacity: canGoPrev ? 1 : 0.18 }}>
          <Ionicons name="chevron-back" size={17} color="#9AB8FF" />
        </Pressable>
        <Text style={{ color: "#F0F6FF", fontSize: 13, fontWeight: "800" }}>
          {MONTHS[viewMonth]}  {viewYear}
        </Text>
        <Pressable onPress={goNext} disabled={!canGoNext} style={{ padding: 8, opacity: canGoNext ? 1 : 0.18 }}>
          <Ionicons name="chevron-forward" size={17} color="#9AB8FF" />
        </Pressable>
      </View>

      {/* Weekday headers */}
      <View style={{ flexDirection: "row", marginBottom: 2 }}>
        {WEEKDAYS.map((wd, i) => (
          <View key={i} style={{ width: cellSize, alignItems: "center" }}>
            <Text style={{ color: "#4A6490", fontSize: 9, fontWeight: "800" }}>{wd}</Text>
          </View>
        ))}
      </View>

      {/* Days grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap" }}>
        {cells.map((cell, i) => {
          const sel = isSelected(cell.date);
          const tod = isToday(cell.date);
          return (
            <Pressable
              key={i}
              onPress={() => !cell.disabled && setSelectedDate(cell.date)}
              disabled={cell.disabled}
              style={{ width: cellSize, height: cellSize, alignItems: "center", justifyContent: "center" }}
            >
              <View
                style={{
                  width: cellSize - 4,
                  height: cellSize - 4,
                  borderRadius: (cellSize - 4) / 2,
                  alignItems: "center",
                  justifyContent: "center",
                  backgroundColor: sel ? "#2447A6" : tod ? "rgba(59,130,246,0.14)" : "transparent",
                  borderWidth: tod && !sel ? 1 : 0,
                  borderColor: "rgba(59,130,246,0.42)",
                }}
              >
                <Text
                  style={{
                    color: sel
                      ? "#FFFFFF"
                      : cell.disabled
                        ? "rgba(255,255,255,0.18)"
                        : cell.inMonth
                          ? "#DCE9FF"
                          : "rgba(255,255,255,0.18)",
                    fontSize: 12,
                    fontWeight: sel ? "900" : "600",
                  }}
                >
                  {cell.date.getDate()}
                </Text>
              </View>
            </Pressable>
          );
        })}
      </View>

      {/* Time input — compact */}
      <View
        style={{
          flexDirection: "row",
          alignItems: "center",
          gap: 8,
          marginTop: 10,
          backgroundColor: "rgba(255,255,255,0.04)",
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "rgba(59,130,246,0.18)",
          paddingHorizontal: 12,
          paddingVertical: 7,
        }}
      >
        <Ionicons name="time-outline" size={14} color="#7B9FD4" />
        <Text style={{ color: "#7B9FD4", fontSize: 12, fontWeight: "700" }}>Horário</Text>
        <View style={{ flex: 1 }} />
        <TextInput
          value={timeInput}
          onChangeText={setTimeInput}
          placeholder="20:00"
          placeholderTextColor="#2D4466"
          keyboardType="numeric"
          maxLength={5}
          style={{
            width: 72,
            backgroundColor: "rgba(59,130,246,0.07)",
            borderRadius: 8,
            borderWidth: 1,
            borderColor: parsedTime ? "rgba(59,130,246,0.28)" : "rgba(220,60,60,0.3)",
            paddingHorizontal: 8,
            paddingVertical: 5,
            color: "#E8F0FF",
            fontSize: 15,
            fontWeight: "800",
            textAlign: "center",
          }}
        />
      </View>

      {/* Confirmation label */}
      {selectedDate && parsedTime && (
        <Text style={{ color: "#7AB2FF", fontSize: 11, fontWeight: "700", textAlign: "center", marginTop: 6 }}>
          {`${String(selectedDate.getDate()).padStart(2, "0")}/${String(selectedDate.getMonth() + 1).padStart(2, "0")} às ${timeInput}`}
        </Text>
      )}

      {/* Actions */}
      <View style={{ flexDirection: "row", gap: 7, marginTop: 12 }}>
        <Pressable
          onPress={onReset}
          style={{
            paddingHorizontal: 12,
            paddingVertical: 9,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: "rgba(220,60,60,0.3)",
            backgroundColor: "rgba(220,60,60,0.08)",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Text style={{ color: "#DC4040", fontSize: 11, fontWeight: "800" }}>Zerar</Text>
        </Pressable>
        <Pressable
          onPress={onCancel}
          style={{
            flex: 1,
            paddingVertical: 9,
            borderRadius: 11,
            borderWidth: 1,
            borderColor: "rgba(255,255,255,0.1)",
            backgroundColor: "rgba(255,255,255,0.05)",
            alignItems: "center",
          }}
        >
          <Text style={{ color: "#8AAAD4", fontSize: 11, fontWeight: "800" }}>Cancelar</Text>
        </Pressable>
        <Pressable
          onPress={handleConfirm}
          disabled={!canConfirm}
          style={{
            flex: 1.4,
            paddingVertical: 9,
            borderRadius: 11,
            backgroundColor: canConfirm ? "#2447A6" : "rgba(36,71,166,0.22)",
            alignItems: "center",
          }}
        >
          <Text style={{ color: canConfirm ? "#FFFFFF" : "rgba(255,255,255,0.3)", fontSize: 11, fontWeight: "800" }}>
            Confirmar
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
