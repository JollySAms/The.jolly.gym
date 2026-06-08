"use client";

export default function TrainerError({
  reset,
}: {
  error: Error;
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[50vh] px-4 text-center">
      <p className="text-sm font-medium text-gray-900 mb-1">Er ging iets mis</p>
      <p className="text-sm text-gray-500 mb-4">Ververs de pagina of probeer opnieuw.</p>
      <button
        onClick={reset}
        className="px-4 py-2 text-sm font-medium bg-gray-900 text-white rounded-xl hover:bg-gray-700"
      >
        Opnieuw proberen
      </button>
    </div>
  );
}
