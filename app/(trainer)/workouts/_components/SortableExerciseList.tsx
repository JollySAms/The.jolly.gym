"use client";

import { useSortable, SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { DndContext, closestCenter, PointerSensor, TouchSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical, Trash2 } from "lucide-react";
import { Id } from "@/convex/_generated/dataModel";

type ExerciseEntry = { exerciseId: Id<"exercises">; name: string; sets: number };

function SortableItem({
  entry, onUpdateSets, onRemove,
}: {
  entry: ExerciseEntry;
  onUpdateSets: (id: Id<"exercises">, sets: number) => void;
  onRemove: (id: Id<"exercises">) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: entry.exerciseId,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="flex items-center gap-2 bg-gray-50 rounded-xl px-3 py-2">
      <button type="button" {...attributes} {...listeners}
        className="p-1 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 touch-none flex-shrink-0">
        <GripVertical size={16} />
      </button>
      <span className="flex-1 text-sm font-medium text-gray-800 truncate">{entry.name}</span>
      <div className="flex items-center gap-1 flex-shrink-0">
        <span className="text-xs text-gray-500">sets:</span>
        <input type="number" min={1} max={20} value={entry.sets}
          onChange={(e) => onUpdateSets(entry.exerciseId, Number(e.target.value))}
          className="w-14 text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
      </div>
      <button type="button" onClick={() => onRemove(entry.exerciseId)}
        className="p-1 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 flex-shrink-0">
        <Trash2 size={15} />
      </button>
    </li>
  );
}

export function SortableExerciseList({
  items, onReorder, onUpdateSets, onRemove,
}: {
  items: ExerciseEntry[];
  onReorder: (items: ExerciseEntry[]) => void;
  onUpdateSets: (id: Id<"exercises">, sets: number) => void;
  onRemove: (id: Id<"exercises">) => void;
}) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 200, tolerance: 5 } }),
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((e) => e.exerciseId === active.id);
    const newIndex = items.findIndex((e) => e.exerciseId === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    const next = [...items];
    const [moved] = next.splice(oldIndex, 1);
    next.splice(newIndex, 0, moved);
    onReorder(next);
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}
    >
      <SortableContext items={items.map((e) => e.exerciseId)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((entry) => (
            <SortableItem key={entry.exerciseId} entry={entry}
              onUpdateSets={onUpdateSets} onRemove={onRemove} />
          ))}
        </ul>
      </SortableContext>
    </DndContext>
  );
}
