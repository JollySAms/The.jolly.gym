"use client";

// --- Medal Badge SVG ---
function MedalBadge({ count }: { count: number }) {
  return (
    <svg width="140" height="170" viewBox="0 0 140 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Ribbons */}
      <path d="M40 95 L15 165 L50 135 L70 170 L70 95Z" fill="#E8913A" />
      <path d="M100 95 L125 165 L90 135 L70 170 L70 95Z" fill="#D4792A" />
      {/* Outer circle */}
      <circle cx="70" cy="65" r="60" fill="#E8913A" />
      {/* Inner ring */}
      <circle cx="70" cy="65" r="50" fill="none" stroke="#F5C56B" strokeWidth="3" />
      {/* Inner circle */}
      <circle cx="70" cy="65" r="42" fill="#F5C56B" />
      {/* Number */}
      <text
        x="70"
        y="65"
        textAnchor="middle"
        dominantBaseline="central"
        fontSize="42"
        fontWeight="bold"
        fill="#D4792A"
        fontFamily="Helvetica, Arial, sans-serif"
      >
        {count}
      </text>
    </svg>
  );
}

// --- PR type labels in Dutch ---
function prTypeLabel(type: string): string {
  switch (type) {
    case "maxWeight": return "Nieuw max gewicht";
    case "maxSetVolume": return "Nieuw set-volume record";
    case "maxTotalVolume": return "Nieuw totaal-volume record";
    case "maxReps": return "Nieuw max herhalingen";
    default: return "Nieuw record";
  }
}

function formatPrValue(type: string, value: number, previousBest: number): string {
  switch (type) {
    case "maxWeight":
      return `${value} kg (was: ${previousBest} kg)`;
    case "maxSetVolume":
      return `${value} kg volume (was: ${previousBest} kg)`;
    case "maxTotalVolume":
      return `${value} kg totaal (was: ${previousBest} kg)`;
    case "maxReps":
      return `${value} reps (was: ${previousBest} reps)`;
    default:
      return `${value} (was: ${previousBest})`;
  }
}

// --- Types ---
export type PRResult = {
  type: string;
  value: number;
  previousBest: number;
  exerciseName: string;
};

// --- New Exercise Celebration ---
export function NewExerciseCelebration({
  exerciseNames,
  onContinue,
}: {
  exerciseNames: string[];
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 gap-4">
      <img
        src="/oh-yeah.png"
        alt="Oh yeah!"
        className="w-36 h-36 object-contain"
      />
      <div className="text-center space-y-1">
        <p className="text-sm text-gray-500">
          {exerciseNames.length === 1 ? "Nieuwe oefening:" : "Nieuwe oefeningen:"}
        </p>
        {exerciseNames.map((name) => (
          <p key={name} className="text-base font-semibold text-gray-900">{name}</p>
        ))}
      </div>
      <p className="text-2xl font-black text-gray-900 tracking-wide">OH YEAH!</p>
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors mt-2"
      >
        Verder
      </button>
    </div>
  );
}

// --- PR Celebration ---
export function PRCelebration({
  prs,
  onContinue,
}: {
  prs: PRResult[];
  onContinue: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-8 px-4 gap-4">
      <MedalBadge count={prs.length} />
      <p className="text-2xl font-black text-gray-900 tracking-wide">NOT WEAK!</p>
      <div className="w-full space-y-3 mt-2">
        {prs.map((pr, i) => (
          <div key={i} className="bg-gray-50 rounded-xl px-4 py-3">
            <p className="text-sm font-semibold text-gray-900">{pr.exerciseName}</p>
            <p className="text-xs text-gray-500">
              {prTypeLabel(pr.type)} — {formatPrValue(pr.type, pr.value, pr.previousBest)}
            </p>
          </div>
        ))}
      </div>
      <button
        onClick={onContinue}
        className="w-full py-3 rounded-xl text-sm font-semibold bg-gray-900 text-white hover:bg-gray-700 transition-colors mt-2"
      >
        Klaar
      </button>
    </div>
  );
}
