"use client";

import { useState } from "react";
import { useQuery, useMutation, useConvexAuth } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { Plus, Pencil, Trash2, Dumbbell } from "lucide-react";
import { WorkoutDialog } from "./_components/WorkoutDialog";

type ExerciseEntry = {
  exerciseId: Id<"exercises">;
  name: string;
  sets: number;
};

type Workout = {
  _id: Id<"workouts">;
  name: string;
  exercises: ExerciseEntry[];
};

export default function WorkoutsPage() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.getMe, isAuthenticated ? {} : "skip");
  const workouts = useQuery(api.workouts.list, isAuthenticated && me?.role === "trainer" ? {} : "skip");
  const archiveWorkout = useMutation(api.workouts.archive);

  const [showAdd, setShowAdd] = useState(false);
  const [editing, setEditing] = useState<Workout | null>(null);
  const [confirmArchive, setConfirmArchive] = useState<Workout | null>(null);

  if (isLoading) return null;
  if (!isAuthenticated) return null;

  const isTrainer = me !== undefined && me?.role === "trainer";

  if (me !== undefined && !isTrainer) {
    return (
      <main className="min-h-screen bg-white max-w-lg mx-auto px-4 py-6">
        <p className="text-sm text-gray-500">Geen toegang.</p>
      </main>
    );
  }

  async function handleArchive(workout: Workout) {
    await archiveWorkout({ id: workout._id });
    setConfirmArchive(null);
  }

  return (
    <main className="min-h-screen bg-white max-w-lg mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-gray-900 mb-1">Workouts</h1>
      <p className="text-sm text-gray-500 mb-6">Maak en beheer je workout templates.</p>

      {workouts === undefined ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : workouts.length === 0 ? (
        <div className="text-center py-16">
          <Dumbbell size={40} className="mx-auto text-gray-200 mb-4" />
          <p className="text-gray-500 text-sm mb-4">Nog geen workouts aangemaakt.</p>
          <button
            onClick={() => setShowAdd(true)}
            className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700"
          >
            Eerste workout aanmaken
          </button>
        </div>
      ) : (
        <ul className="space-y-3">
          {workouts.map((workout) => (
            <li
              key={workout._id}
              className="bg-gray-50 rounded-xl px-4 py-3"
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{workout.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {workout.exercises.length === 0
                      ? "Geen oefeningen"
                      : workout.exercises.map((e) => e.name).join(" · ")}
                  </p>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => setEditing(workout as Workout)}
                    title="Bewerken"
                    className="p-2 rounded-lg hover:bg-white text-gray-500 hover:text-gray-800 transition-colors"
                  >
                    <Pencil size={16} />
                  </button>
                  <button
                    onClick={() => setConfirmArchive(workout as Workout)}
                    title="Verwijderen"
                    className="p-2 rounded-lg hover:bg-white text-gray-500 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Exercise pills */}
              {workout.exercises.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {workout.exercises.map((e) => (
                    <span
                      key={e.exerciseId}
                      className="text-xs bg-white border border-gray-200 rounded-full px-2.5 py-0.5 text-gray-600"
                    >
                      {e.name} · {e.sets}×
                    </span>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      {/* FAB */}
      {workouts !== undefined && workouts.length > 0 && (
        <button
          onClick={() => setShowAdd(true)}
          className="fixed bottom-24 right-6 md:bottom-6 flex items-center gap-2 px-4 py-3 bg-blue-600 text-white text-sm font-semibold rounded-full shadow-lg hover:bg-blue-700"
        >
          <Plus size={18} />
          Workout toevoegen
        </button>
      )}

      {/* Archive confirmation */}
      {confirmArchive && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
          <div className="absolute inset-0 bg-black/40" onClick={() => setConfirmArchive(null)} />
          <div className="relative bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-900 mb-2">Workout verwijderen?</h3>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-medium text-gray-700">{confirmArchive.name}</span> wordt
              gearchiveerd. Sessies die deze workout gebruiken blijven ongewijzigd.
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setConfirmArchive(null)}
                className="flex-1 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-600 hover:bg-gray-50"
              >
                Annuleren
              </button>
              <button
                onClick={() => handleArchive(confirmArchive)}
                className="flex-1 py-2.5 rounded-xl bg-red-500 text-sm font-semibold text-white hover:bg-red-600"
              >
                Verwijderen
              </button>
            </div>
          </div>
        </div>
      )}

      {showAdd && <WorkoutDialog onClose={() => setShowAdd(false)} />}
      {editing && <WorkoutDialog workout={editing} onClose={() => setEditing(null)} />}
    </main>
  );
}
