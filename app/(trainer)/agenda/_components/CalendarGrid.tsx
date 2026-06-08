"use client";

import { useMemo } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameDay, isToday } from "date-fns";

type Session = {
  _id: string;
  date: string;
  group: { color: string } | null;
};

type Props = {
  currentMonth: Date;
  sessions: Session[];
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
};

const DAY_LABELS = ["MA", "DI", "WO", "DO", "VR", "ZA", "ZO"];

export function CalendarGrid({ currentMonth, sessions, selectedDate, onSelectDate }: Props) {
  const days = useMemo(() => {
    const start = startOfMonth(currentMonth);
    const end = endOfMonth(currentMonth);
    return eachDayOfInterval({ start, end });
  }, [currentMonth]);

  // Monday = 0 offset (getDay returns 0=Sun, shift to Mon-based)
  const startOffset = useMemo(() => {
    const day = getDay(startOfMonth(currentMonth));
    return day === 0 ? 6 : day - 1;
  }, [currentMonth]);

  // Group sessions by date string for quick lookup
  const sessionsByDate = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  return (
    <div>
      {/* Day headers */}
      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((label) => (
          <div key={label} className="text-center text-xs font-medium text-gray-500 py-1">
            {label}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before first day */}
        {Array.from({ length: startOffset }).map((_, i) => (
          <div key={`empty-${i}`} />
        ))}

        {days.map((day) => {
          const dateStr = format(day, "yyyy-MM-dd");
          const daySessions = sessionsByDate[dateStr] ?? [];
          const hasSession = daySessions.length > 0;
          const isSelected = selectedDate ? isSameDay(day, selectedDate) : false;
          const todayDay = isToday(day);

          // Pick the first session's group color for the background
          const bgColor = daySessions[0]?.group?.color ?? null;

          return (
            <button
              key={dateStr}
              onClick={() => onSelectDate(day)}
              className={`
                relative flex flex-col items-center justify-center aspect-square rounded-lg text-sm font-medium transition-colors
                ${isSelected && !hasSession ? "bg-gray-800 text-white" : ""}
                ${isSelected && hasSession ? "ring-2 ring-offset-1 ring-gray-800" : ""}
                ${!hasSession && !isSelected && todayDay ? "bg-gray-200 text-gray-900" : ""}
                ${!hasSession && !isSelected && !todayDay ? "text-gray-700 hover:bg-gray-100" : ""}
                ${hasSession && !isSelected ? "text-white" : ""}
              `}
              style={hasSession ? { backgroundColor: bgColor ?? "#3B82F6" } : undefined}
            >
              <span>{format(day, "d")}</span>
              {hasSession && (
                <span className="text-[8px] leading-none opacity-80 mt-0.5">
                  {"○".repeat(Math.min(daySessions.length, 3))}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
