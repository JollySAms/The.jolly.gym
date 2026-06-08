"use client";

import { useQuery } from "convex/react";
import { useState } from "react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import { X, Search } from "lucide-react";

type Props = {
  onSelect: (exerciseId: Id<"exercises">, exerciseName: string) => void;
  onClose: () => void;
  excludeIds?: Id<"exercises">[];
};

export function ExercisePickerSheet({ onSelect, onClose, excludeIds = [] }: Props) {
  const exercises = useQuery(api.exercises.list);
  const [search, setSearch] = useState("");

  const filtered = (exercises ?? []).filter(
    (ex) =>
      !excludeIds.includes(ex._id) &&
      ex.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-t-2xl sm:rounded-2xl shadow-xl overflow-hidden max-h-[80vh] flex flex-col">
        <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-gray-100 shrink-0">
          <p className="text-base font-bold text-gray-900">Oefening toevoegen</p>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-gray-100">
            <X size={18} className="text-gray-500" />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-gray-100 shrink-0">
          <div className="relative">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Zoek oefening..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              autoFocus
              className="w-full pl-9 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent"
            />
          </div>
        </div>

        <div className="overflow-y-auto flex-1">
          {exercises === undefined ? (
            <div className="p-4 space-y-2">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="h-10 bg-gray-100 rounded-lg animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">
              {search ? "Geen resultaten" : "Geen oefeningen beschikbaar"}
            </p>
          ) : (
            <div className="divide-y divide-gray-50">
              {filtered.map((ex) => (
                <button
                  key={ex._id}
                  onClick={() => {
                    onSelect(ex._id, ex.name);
                    onClose();
                  }}
                  className="w-full text-left px-4 py-3 text-sm text-gray-900 hover:bg-gray-50 transition-colors"
                >
                  {ex.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
