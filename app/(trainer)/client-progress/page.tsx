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

export default function TrainerProgressionPage() {
  const { isSignedIn } = useAuth();
  const clients = useQuery(api.users.listClients, isSignedIn ? {} : "skip");
  const exercises = useQuery(api.exercises.list, isSignedIn ? {} : "skip");

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
      <div className="flex flex-col gap-3 mb-6">
        {/* Client picker */}
        {loading ? (
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <SearchCombobox
            items={(clients ?? []).map((c) => ({
              label: c.name,
              value: c.tokenIdentifier,
            }))}
            value={selectedClientToken}
            onChange={(v) => {
              setSelectedClientToken(v);
              setSelectedExerciseId(null);
            }}
            placeholder="Zoek klant..."
          />
        )}

        {/* Exercise picker */}
        {loading ? (
          <div className="h-11 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <SearchCombobox
            items={(exercises ?? []).map((ex) => ({ label: ex.name, value: ex._id }))}
            value={selectedExerciseId}
            onChange={(v) => setSelectedExerciseId(v as Id<"exercises"> | null)}
            placeholder="Zoek oefening..."
            disabled={!selectedClientToken}
          />
        )}
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
                ? format(parse(entry.sessionDate, "yyyy-MM-dd", new Date(0)), "d MMM yyyy", {
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
