"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, parse } from "date-fns";
import { nl } from "date-fns/locale";
import { TrendingUp } from "lucide-react";
import { SearchCombobox } from "@/components/SearchCombobox";

export default function ProgressionPage() {
  const { isSignedIn } = useAuth();
  const exercises = useQuery(api.exercises.list, isSignedIn ? {} : "skip");
  const [selectedId, setSelectedId] = useState<Id<"exercises"> | null>(null);

  const history = useQuery(
    api.workoutLogs.getMyProgressionForExercise,
    selectedId ? { exerciseId: selectedId } : "skip"
  );

  const selectedName = exercises?.find((e) => e._id === selectedId)?.name ?? null;

  return (
    <div className="max-w-lg mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={18} className="text-gray-400" />
        <h1 className="text-lg font-bold text-gray-900">Progressie</h1>
      </div>

      {/* Exercise picker */}
      <div className="mb-6">
        {exercises === undefined ? (
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <SearchCombobox
            items={exercises.map((ex) => ({ label: ex.name, value: ex._id }))}
            value={selectedId}
            onChange={(v) => setSelectedId(v as Id<"exercises"> | null)}
            placeholder="Zoek oefening..."
          />
        )}
      </div>

      {/* History */}
      {!selectedId ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">Kies een oefening om je progressie te zien</p>
        </div>
      ) : history === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-500">
            Nog geen logs voor {selectedName}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {history.map((entry) => {
            const dateLabel = entry.sessionDate
              ? format(parse(entry.sessionDate, "yyyy-MM-dd", new Date(0)), "d MMM yyyy", {
                  locale: nl,
                })
              : "Onbekende datum";

            const best = entry.sets.reduce(
              (max, s) => (s.weight > max ? s.weight : max),
              0
            );

            return (
              <div
                key={entry._id}
                className="bg-gray-50 rounded-xl px-4 py-3 space-y-2"
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-gray-900">{dateLabel}</p>
                  {best > 0 && (
                    <span className="text-xs font-medium text-gray-500">
                      max {best} kg
                    </span>
                  )}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {entry.sets.map((s, i) => (
                    <span
                      key={i}
                      className="text-xs bg-white border border-gray-100 rounded-full px-2.5 py-1 text-gray-600"
                    >
                      {s.reps}× {s.weight} kg
                    </span>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
