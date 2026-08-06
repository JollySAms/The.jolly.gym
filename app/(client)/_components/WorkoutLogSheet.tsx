"use client";

import { useQuery, useMutation } from "convex/react";
import { useState, useEffect } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Plus, Trash2, Dumbbell } from "lucide-react";
import { toast } from "sonner";
import { ExercisePickerSheet } from "./ExercisePickerSheet";

type WorkoutExercise = {
  exerciseId: Id<"exercises">;
  name: string;
  sets: number;
};

type LogSet = { id: string; reps: string; weight: string };

let _setIdCounter = 0;
function newSetId() {
  return `set-${Date.now()}-${++_setIdCounter}`;
}

type LoggedExercise = {
  exerciseId: Id<"exercises">;
  exerciseName: string;
  isSubstitute: boolean;
  sets: LogSet[];
};

type Props = {
  sessionId: Id<"sessions">;
  workoutName: string | null;
  workoutSnapshot: WorkoutExercise[];
  onClose: () => void;
};

export function WorkoutLogSheet({ sessionId, workoutName, workoutSnapshot, onClose }: Props) {
  const existingLogs = useQuery(api.workoutLogs.getMyLog, { sessionId });
  const saveLog = useMutation(api.workoutLogs.saveLog);
  const deleteLog = useMutation(api.workoutLogs.deleteLog);

  const [exercises, setExercises] = useState<LoggedExercise[]>([]);
  const [initialized, setInitialized] = useState(false);
  const [removedExerciseIds, setRemovedExerciseIds] = useState<Id<"exercises">[]>([]);
  // Tracks which prescribed exercises had saved data on open — needed to delete stale entries on save
  const [savedPrescribedIds, setSavedPrescribedIds] = useState<Set<Id<"exercises">>>(new Set());
  const [showPicker, setShowPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const exerciseIds = exercises.map((e) => e.exerciseId);
  const lastLogs = useQuery(
    api.workoutLogs.getMyLastLogs,
    initialized && exerciseIds.length > 0 ? { exerciseIds } : "skip"
  );

  // Merge snapshot + existing log entries on first load
  useEffect(() => {
    if (existingLogs === undefined || initialized) return;

    const logMap = new Map(existingLogs.map((l: { exerciseId: string | null | undefined; sets: { reps: number; weight: number }[]; isSubstitute?: boolean; exerciseName?: string; deleted?: boolean }) => [l.exerciseId, l]));

    const prescribed: LoggedExercise[] = workoutSnapshot
      .filter((ex) => {
        const entry = logMap.get(ex.exerciseId) as { deleted?: boolean } | undefined;
        return !entry?.deleted; // skip exercises the client explicitly removed
      })
      .map((ex) => {
        const saved = logMap.get(ex.exerciseId) as { sets: { reps: number; weight: number }[] } | undefined;
        return {
          exerciseId: ex.exerciseId,
          exerciseName: ex.name,
          isSubstitute: false,
          sets: saved
            ? saved.sets.map((s) => ({ id: newSetId(), reps: String(s.reps), weight: String(s.weight) }))
            : Array.from({ length: ex.sets }, () => ({ id: newSetId(), reps: "", weight: "" })),
        };
      });

    const snapshotIds = new Set(workoutSnapshot.map((e) => e.exerciseId));
    const substitutes: LoggedExercise[] = existingLogs
      .filter((l) => l.isSubstitute && !snapshotIds.has(l.exerciseId))
      .map((l) => ({
        exerciseId: l.exerciseId,
        exerciseName: l.exerciseName,
        isSubstitute: true,
        sets: l.sets.map((s) => ({ id: newSetId(), reps: String(s.reps), weight: String(s.weight) })),
      }));

    // Track which prescribed exercises already have saved (non-deleted) data
    const savedIds = new Set<Id<"exercises">>(
      workoutSnapshot
        .filter((ex) => {
          const entry = logMap.get(ex.exerciseId) as { deleted?: boolean } | undefined;
          return entry && !entry.deleted;
        })
        .map((ex) => ex.exerciseId)
    );
    setSavedPrescribedIds(savedIds);

    setExercises([...prescribed, ...substitutes]);
    setInitialized(true);
  }, [existingLogs, initialized, workoutSnapshot]);

  function updateSet(exIndex: number, setIndex: number, field: "reps" | "weight", value: string) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex
          ? { ...ex, sets: ex.sets.map((s, j) => (j === setIndex ? { ...s, [field]: value } : s)) }
          : ex
      )
    );
  }

  function addSet(exIndex: number) {
    setExercises((prev) =>
      prev.map((ex, i) =>
        i === exIndex ? { ...ex, sets: [...ex.sets, { id: newSetId(), reps: "", weight: "" }] } : ex
      )
    );
  }

  function removeSet(exIndex: number, setIndex: number) {
    const ex = exercises[exIndex];
    const updated = ex.sets.filter((_, j) => j !== setIndex);

    // No sets left: remove the whole exercise
    if (updated.length === 0) {
      removeExercise(exIndex);
      return;
    }

    setExercises((prev) =>
      prev.map((e, i) => (i === exIndex ? { ...e, sets: updated } : e))
    );
  }

  function removeExercise(exIndex: number) {
    const ex = exercises[exIndex];
    setRemovedExerciseIds((prev) => [...prev, ex.exerciseId]);
    setExercises((prev) => prev.filter((_, i) => i !== exIndex));
  }

  function addSubstitute(exerciseId: Id<"exercises">, exerciseName: string) {
    setRemovedExerciseIds((prev) => prev.filter((id) => id !== exerciseId));
    setExercises((prev) => {
      if (prev.some((e) => e.exerciseId === exerciseId)) return prev;
      return [...prev, { exerciseId, exerciseName, isSubstitute: true, sets: [{ id: newSetId(), reps: "", weight: "" }] }];
    });
  }

  async function handleSave() {
    setSaving(true);
    try {
      const toSave = exercises
        .map((ex) => ({
          ex,
          validSets: ex.sets
            .filter((s) => Number(s.reps) > 0 || Number(s.weight) > 0)
            .map((s) => ({ reps: Number(s.reps) || 0, weight: Number(s.weight) || 0 })),
        }))
        .filter(({ validSets }) => validSets.length > 0);

      // Prescribed exercises that had saved data but now have no valid sets → delete stale entry
      const savedExerciseIds = new Set(toSave.map(({ ex }) => ex.exerciseId));
      const stalePrescribedIds = [...savedPrescribedIds].filter(
        (id) => !savedExerciseIds.has(id)
      );

      await Promise.all([
        ...toSave.map(({ ex, validSets }) =>
          saveLog({
            sessionId,
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets: validSets,
            isSubstitute: ex.isSubstitute,
          })
        ),
        ...removedExerciseIds.map((exerciseId) => deleteLog({ sessionId, exerciseId })),
        ...stalePrescribedIds.map((exerciseId) => deleteLog({ sessionId, exerciseId })),
      ]);

      setSaved(true);
    } catch {
      toast.error("Opslaan mislukt. Probeer opnieuw.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <div className="fixed inset-0 z-[55] flex items-end sm:items-center justify-center">
        <div className="absolute inset-0 bg-black/40" onClick={saving ? undefined : onClose} />

        <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
            <div className="flex items-center gap-2">
              <Dumbbell size={16} className="text-gray-400" />
              <p className="text-base font-bold text-gray-900">
                {workoutName ?? "Workout loggen"}
              </p>
            </div>
            <button onClick={saving ? undefined : onClose} className="p-1.5 rounded-full hover:bg-gray-100">
              <X size={18} className="text-gray-500" />
            </button>
          </div>

          {/* Body */}
          <div className="overflow-y-auto flex-1 px-4 py-4 space-y-6">
            {saved ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3">
                <p className="text-4xl">👍</p>
                <p className="text-lg font-bold text-gray-900">Goed gedaan!</p>
                <p className="text-sm text-gray-500">Workout opgeslagen</p>
                <div className="flex flex-col gap-2 w-full mt-4">
                  <button
                    onClick={onClose}
                    className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors"
                  >
                    Klaar
                  </button>
                  <button
                    onClick={() => setSaved(false)}
                    className="w-full py-3 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-100 transition-colors"
                  >
                    Verder loggen
                  </button>
                </div>
              </div>
            ) : !initialized ? (
              <div className="space-y-5">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 w-28 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                    <div className="h-10 bg-gray-100 rounded-lg animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <>
                {exercises.map((ex, exIndex) => (
                  <div key={ex.exerciseId}>
                    {/* Exercise header */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900">{ex.exerciseName}</p>
                        {ex.isSubstitute && (
                          <span className="text-[10px] font-medium text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded-full">
                            vervanger
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeExercise(exIndex)}
                        className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>

                    {/* Column labels */}
                    <div className="grid grid-cols-[20px_2fr_1fr_1fr_24px] gap-2 px-1 mb-1">
                      <span className="text-[10px] font-medium text-gray-500 text-center">#</span>
                      <span className="text-[10px] font-medium text-gray-600">Vorige</span>
                      <span className="text-[10px] font-medium text-gray-500 text-center">Herh</span>
                      <span className="text-[10px] font-medium text-gray-500 text-center">Kg</span>
                      <span />
                    </div>

                    {/* Set rows */}
                    <div className="space-y-1.5">
                      {ex.sets.map((set, setIndex) => {
                        const lastSet = lastLogs?.[ex.exerciseId]?.[setIndex];
                        return (
                        <div
                          key={set.id}
                          className="grid grid-cols-[20px_2fr_1fr_1fr_24px] gap-2 items-center"
                        >
                          <span className="text-xs text-gray-500 text-center font-medium">
                            {setIndex + 1}
                          </span>
                          <span className="text-xs text-gray-600 truncate">
                            {lastSet ? `${lastSet.reps}× ${lastSet.weight} kg` : "–"}
                          </span>
                          <input
                            type="number"
                            min="0"
                            step="1"
                            placeholder="–"
                            value={set.reps}
                            onChange={(e) => updateSet(exIndex, setIndex, "reps", e.target.value)}
                            className="w-full text-center text-sm py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                          <input
                            type="number"
                            min="0"
                            step="0.5"
                            placeholder="–"
                            value={set.weight}
                            onChange={(e) => updateSet(exIndex, setIndex, "weight", e.target.value)}
                            className="w-full text-center text-sm py-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
                          />
                          <button
                            onClick={() => removeSet(exIndex, setIndex)}
                            className="flex items-center justify-center p-1 rounded hover:bg-gray-100 text-gray-300 hover:text-gray-500 transition-colors"
                          >
                            <X size={13} />
                          </button>
                        </div>
                        );
                      })}
                    </div>

                    {/* Add set */}
                    <button
                      onClick={() => addSet(exIndex)}
                      className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-900 transition-colors mt-2 py-1"
                    >
                      <Plus size={12} />
                      Set toevoegen
                    </button>
                  </div>
                ))}

                {/* Add substitute exercise */}
                <button
                  onClick={() => setShowPicker(true)}
                  className="flex items-center gap-2 w-full py-2 text-sm text-gray-500 hover:text-gray-900 transition-colors"
                >
                  <div className="w-6 h-6 rounded-full border-2 border-dashed border-gray-200 flex items-center justify-center shrink-0">
                    <Plus size={12} />
                  </div>
                  Oefening toevoegen
                </button>
              </>
            )}
          </div>

          {/* Footer */}
          {!saved && (
            <div className="px-4 py-4 border-t border-gray-100 shrink-0">
              <button
                onClick={handleSave}
                disabled={saving || !initialized}
                className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {saving ? "Opslaan..." : "Opslaan"}
              </button>
            </div>
          )}
        </div>
      </div>

      {showPicker && (
        <ExercisePickerSheet
          onSelect={addSubstitute}
          onClose={() => setShowPicker(false)}
          excludeIds={exerciseIds}
        />
      )}
    </>
  );
}
