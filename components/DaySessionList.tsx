"use client";

import { format } from "date-fns";
import { nl } from "date-fns/locale";
import { Id } from "@/convex/_generated/dataModel";

type EnrichedSession = {
  _id: Id<"sessions">;
  date: string;
  time: string;
  groupId: Id<"groups">;
  capacity: number;
  group: { _id: Id<"groups">; name: string; color: string } | null;
  attendanceCount: number;
};

type Props<T extends EnrichedSession> = {
  date: Date;
  sessions: T[] | undefined;
  onSelectSession: (session: T) => void;
};

export function DaySessionList<T extends EnrichedSession>({ date, sessions, onSelectSession }: Props<T>) {
  const dateLabel = format(date, "EEE d/M", { locale: nl });

  return (
    <div className="mt-4">
      <p className="text-sm font-bold text-gray-800 mb-2 capitalize">{dateLabel}</p>

      {sessions === undefined ? (
        <p className="text-sm text-gray-400">Laden...</p>
      ) : sessions.length === 0 ? (
        <p className="text-sm text-gray-400">Geen klassen</p>
      ) : (
        <div className="divide-y divide-gray-100">
          {sessions
            .slice()
            .sort((a, b) => a.time.localeCompare(b.time))
            .map((session) => {
              const color = session.group?.color ?? "#3B82F6";
              return (
                <button
                  key={session._id}
                  onClick={() => onSelectSession(session)}
                  className="w-full flex items-center gap-3 py-3 text-left hover:bg-gray-50 transition-colors"
                >
                  {/* Colored time badge */}
                  <div
                    className="flex-shrink-0 w-14 py-1 rounded-md text-center text-sm font-semibold text-white"
                    style={{ backgroundColor: color }}
                  >
                    {session.time}
                  </div>

                  {/* Group name */}
                  <span className="flex-1 text-sm font-medium text-gray-900">
                    {session.group?.name ?? "Onbekende groep"}
                  </span>

                  {/* Spots count */}
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    {session.attendanceCount}/{session.capacity}
                    <svg
                      className="w-4 h-4 text-gray-400"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <circle cx="12" cy="12" r="9" strokeWidth="1.5" />
                      <path
                        strokeLinecap="round"
                        strokeWidth="1.5"
                        d="M12 6v6l3 3"
                      />
                    </svg>
                  </span>
                </button>
              );
            })}
        </div>
      )}
    </div>
  );
}
