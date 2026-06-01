"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { format, parse } from "date-fns";
import { nl } from "date-fns/locale";
import { TrendingUp, ChevronDown } from "lucide-react";

export default function TrainerProgressionPage() {
  const clients = useQuery(api.users.listClients);
  const exercises = useQuery(api.exercises.list);

  const [selectedClientToken, setSelectedClientToken] = useState<string | null>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<Id<"exercises"> | null>(null);

  const history = useQuery(
    api.workoutLogs.getForExercise,
    selectedClientToken && selectedExerciseId
      ? { exerciseId: selectedExerciseId, clientTokenIdentifier: selectedClientToken }
      : "skip"
  );

  const selectedClientName =
    clients?.find((c) => c.tokenIdentifier === selectedClientToken)?.name ?? null;
  const selectedExerciseName =
    exercises?.find((e) => e._id === selectedExerciseId)?.name ?? null;

  const loading = clients === undefined || exercises === undefined;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Header */}
      <div className="flex items-center gap-2 mb-6">
        <TrendingUp size={18} className="text-gray-400" />
        <h1 className="text-lg font-bold text-gray-900">Progressie</h1>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        {/* Client picker */}
        <div className="relative">
          {loading ? (
            <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <>
              <select
                value={selectedClientToken ?? ""}
                onChange={(e) => {
                  setSelectedClientToken(e.target.value || null);
                  setSelectedExerciseId(null);
                }}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-9"
              >
                <option value="">Kies klant...</option>
                {(clients ?? []).map((c) => (
                  <option key={c._id} value={c.tokenIdentifier}>
                    {c.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </>
          )}
        </div>

        {/* Exercise picker */}
        <div className="relative">
          {loading ? (
            <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
          ) : (
            <>
              <select
                value={selectedExerciseId ?? ""}
                onChange={(e) =>
                  setSelectedExerciseId(
                    e.target.value ? (e.target.value as Id<"exercises">) : null
                  )
                }
                disabled={!selectedClientToken}
                className="w-full appearance-none bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent pr-9 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <option value="">Kies oefening...</option>
                {(exercises ?? []).map((ex) => (
                  <option key={ex._id} value={ex._id}>
                    {ex.name}
                  </option>
                ))}
              </select>
              <ChevronDown
                size={15}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
              />
            </>
          )}
        </div>
      </div>

      {/* History */}
      {!selectedClientToken || !selectedExerciseId ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">
            {!selectedClientToken
              ? "Kies eerst een klant"
              : "Kies een oefening om de progressie te zien"}
          </p>
        </div>
      ) : history === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : history.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-sm text-gray-400">
            Geen logs voor {selectedClientName} — {selectedExerciseName}
          </p>
        </div>
      ) : (
        <>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
            {selectedClientName} · {selectedExerciseName}
          </p>
          <div className="space-y-3">
            {history.map((entry) => {
              const dateLabel = entry.sessionDate
                ? format(parse(entry.sessionDate, "yyyy-MM-dd", new Date()), "d MMM yyyy", {
                    locale: nl,
                  })
                : "Onbekende datum";

              const best = entry.sets.reduce(
                (max, s) => (s.weight > max ? s.weight : max),
                0
              );

              return (
                <div key={entry._id} className="bg-gray-50 rounded-xl px-4 py-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{dateLabel}</p>
                    {best > 0 && (
                      <span className="text-xs font-medium text-gray-500">max {best} kg</span>
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
        </>
      )}
    </div>
  );
}
