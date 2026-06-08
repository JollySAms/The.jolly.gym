"use client";

import { useEffect, useRef, useState } from "react";
import { Search, X } from "lucide-react";

type Item = { label: string; value: string };

type Props = {
  items: Item[];
  value: string | null;
  onChange: (value: string | null) => void;
  placeholder: string;
  disabled?: boolean;
};

export function SearchCombobox({
  items,
  value,
  onChange,
  placeholder,
  disabled = false,
}: Props) {
  const [inputText, setInputText] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const selectedLabel = items.find((i) => i.value === value)?.label ?? null;

  // When closed and a value is selected, show the label; otherwise show what the user typed
  const displayText = !open && selectedLabel ? selectedLabel : inputText;

  const filtered = items.filter((i) =>
    i.label.toLowerCase().includes(inputText.toLowerCase())
  );

  // Close when clicking outside
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setInputText("");
      }
    }
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, []);

  function handleSelect(item: Item) {
    onChange(item.value);
    setInputText("");
    setOpen(false);
  }

  function handleClear(e: React.MouseEvent) {
    e.stopPropagation();
    onChange(null);
    setInputText("");
    setOpen(false);
  }

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <Search
          size={15}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none"
        />
        <input
          type="text"
          value={displayText}
          onChange={(e) => {
            setInputText(e.target.value);
            setOpen(true);
            // Clear current selection so results reflect fresh search
            if (value) onChange(null);
          }}
          onFocus={() => {
            setInputText("");
            setOpen(true);
          }}
          placeholder={placeholder}
          disabled={disabled}
          className="w-full pl-9 pr-8 py-2.5 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900 focus:border-transparent disabled:opacity-40 disabled:cursor-not-allowed text-gray-900 placeholder:text-gray-400"
        />
        {value && !open && (
          <button
            onClick={handleClear}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 p-0.5 rounded-full hover:bg-gray-200 transition-colors"
          >
            <X size={13} className="text-gray-400" />
          </button>
        )}
      </div>

      {open && !disabled && (
        <div className="absolute z-10 top-full mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
          {filtered.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Geen resultaten</p>
          ) : (
            filtered.map((item) => (
              <button
                key={item.value}
                // Prevent input blur from firing before onClick
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => handleSelect(item)}
                className="w-full text-left px-4 py-2.5 text-sm text-gray-900 hover:bg-gray-50 transition-colors first:rounded-t-xl last:rounded-b-xl"
              >
                {item.label}
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
}
