"use client";

import { useState, useMemo } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Plus, Search, ChevronDown, ChevronUp, Pencil, Check } from "lucide-react";
import { SortableExerciseList } from "./SortableExerciseList";

type ExerciseEntry = { exerciseId: Id<"exercises">; name: string; sets: number };
type Workout = { _id: Id<"workouts">; name: string; exercises: ExerciseEntry[] };
type Props = { workout?: Workout; onClose: () => void };

export function WorkoutDialog({ workout, onClose }: Props) {
  const exercises = useQuery(api.exercises.list);
  const createWorkout = useMutation(api.workouts.create);
  const updateWorkout = useMutation(api.workouts.update);
  const createExercise = useMutation(api.exercises.create);
  const updateExercise = useMutation(api.exercises.update);
  const [name, setName] = useState(workout?.name ?? "");
  const [selected, setSelected] = useState<ExerciseEntry[]>(workout?.exercises ?? []);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);
  const [newExerciseName, setNewExerciseName] = useState("");
  const [addingExercise, setAddingExercise] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [renamingId, setRenamingId] = useState<Id<"exercises"> | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const filteredExercises = useMemo(() => {
    if (!exercises) return [];
    const sorted = [...exercises].sort((a, b) => a.name.localeCompare(b.name, "nl"));
    if (!search.trim()) return sorted;
    const q = search.trim().toLowerCase();
    return sorted.filter((e) => e.name.toLowerCase().includes(q));
  }, [exercises, search]);
  const selectedIds = new Set(selected.map((e) => e.exerciseId));

  function addExercise(exercise: { _id: Id<"exercises">; name: string }) {
    if (selectedIds.has(exercise._id)) return;
    setSelected((prev) => [...prev, { exerciseId: exercise._id, name: exercise.name, sets: 3 }]);
    setSearch("");
  }
  async function handleAddNewExercise() {
    const trimmed = newExerciseName.trim();
    if (!trimmed) return;
    setAddingExercise(true);
    try {
      const id = await createExercise({ name: trimmed });
      setSelected((prev) => [...prev, { exerciseId: id, name: trimmed, sets: 3 }]);
      setNewExerciseName("");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally { setAddingExercise(false); }
  }
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) { setError("Geef de workout een naam"); return; }
    setSaving(true); setError(null);
    try {
      if (workout) { await updateWorkout({ id: workout._id, name: name.trim(), exercises: selected }); }
      else { await createWorkout({ name: name.trim(), exercises: selected }); }
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Er ging iets mis");
    } finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[90vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-2 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-sm font-semibold text-gray-800">{workout ? "Workout bewerken" : "Nieuwe workout"}</h2>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100"><X size={18} className="text-gray-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-4 space-y-5">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">Naam workout</label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="bijv. Leg Day A" required
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-2">Oefeningen ({selected.length})</label>
              {selected.length === 0 ? (
                <p className="text-sm text-gray-500 py-2">Nog geen oefeningen toegevoegd.</p>
              ) : (
                <SortableExerciseList items={selected} onReorder={setSelected}
                  onUpdateSets={(id, sets) => setSelected((p) => p.map((e) => (e.exerciseId === id ? { ...e, sets: Math.max(1, sets) } : e)))}
                  onRemove={(id) => setSelected((p) => p.filter((e) => e.exerciseId !== id))} />
              )}
            </div>
            <div className="border border-gray-200 rounded-xl overflow-hidden">
              <button type="button" onClick={() => setShowPicker((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50">
                <span className="flex items-center gap-2"><Plus size={16} className="text-blue-600" />Oefening toevoegen</span>
                {showPicker ? <ChevronUp size={16} className="text-gray-400" /> : <ChevronDown size={16} className="text-gray-400" />}
              </button>
              {showPicker && (
                <div className="border-t border-gray-100 p-3 space-y-3">
                  <div className="relative">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="text" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Zoek oefening..."
                      className="w-full pl-8 pr-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                  </div>
                  {exercises === undefined ? (
                    <p className="text-sm text-gray-500">Laden...</p>
                  ) : filteredExercises.length === 0 && search ? (
                    <p className="text-sm text-gray-500">Geen resultaten voor &ldquo;{search}&rdquo;</p>
                  ) : (
                    <ul className="max-h-40 overflow-y-auto space-y-1">
                      {filteredExercises.map((ex) => {
                        const alreadyAdded = selectedIds.has(ex._id);
                        return (
                          <li key={ex._id} className="flex items-center gap-1">
                            {renamingId === ex._id ? (
                              <form className="flex items-center gap-1 flex-1 min-w-0" onSubmit={async (e) => {
                                e.preventDefault();
                                const trimmed = renameValue.trim();
                                if (trimmed && trimmed !== ex.name) {
                                  await updateExercise({ id: ex._id, name: trimmed });
                                  setSelected((p) => p.map((s) => s.exerciseId === ex._id ? { ...s, name: trimmed } : s));
                                }
                                setRenamingId(null);
                              }}>
                                <input autoFocus type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                                  onKeyDown={(e) => { if (e.key === "Escape") setRenamingId(null); }}
                                  className="flex-1 min-w-0 border border-gray-200 rounded-lg px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <button type="submit" className="p-1.5 rounded-lg hover:bg-green-50 text-gray-400 hover:text-green-600 flex-shrink-0"><Check size={14} /></button>
                              </form>
                            ) : (<>
                              <button type="button" disabled={alreadyAdded} onClick={() => addExercise(ex)}
                                className="flex-1 text-left px-3 py-2 text-sm rounded-lg disabled:opacity-40 disabled:cursor-not-allowed hover:bg-blue-50 hover:text-blue-700 text-gray-700 truncate">
                                {ex.name}{alreadyAdded && <span className="ml-2 text-xs text-gray-500">toegevoegd</span>}
                              </button>
                              <button type="button" onClick={() => { setRenamingId(ex._id); setRenameValue(ex.name); }}
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-300 hover:text-gray-500 flex-shrink-0"><Pencil size={13} /></button>
                            </>)}
                          </li>);
                      })}
                    </ul>
                  )}
                  <div className="border-t border-gray-100 pt-3">
                    <p className="text-xs text-gray-500 mb-2">Oefening staat er niet bij?</p>
                    <div className="flex gap-2">
                      <input type="text" value={newExerciseName} onChange={(e) => setNewExerciseName(e.target.value)} placeholder="Nieuwe oefening..."
                        onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddNewExercise(); } }}
                        className="flex-1 border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                      <button type="button" onClick={handleAddNewExercise} disabled={addingExercise || !newExerciseName.trim()}
                        className="px-3 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50">
                        {addingExercise ? "..." : "Toevoegen"}</button>
                    </div>
                  </div>
                </div>
              )}
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
          </div>
          <div className="p-4 border-t border-gray-100 flex-shrink-0">
            <button type="submit" disabled={saving}
              className="w-full py-3 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50">
              {saving ? "Opslaan..." : workout ? "Wijzigingen opslaan" : "Workout opslaan"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
