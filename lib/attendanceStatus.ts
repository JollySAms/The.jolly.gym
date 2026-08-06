export type AttendeeStatus = "coming" | "cancelled" | "no_response";

export const STATUS_CONFIG = {
  coming:      { label: "Komt",     bg: "bg-green-50", text: "text-green-700", border: "border-green-200" },
  cancelled:   { label: "Afgemeld", bg: "bg-red-50",   text: "text-red-600",   border: "border-red-200" },
  no_response: { label: "–",        bg: "bg-gray-50",  text: "text-gray-400",  border: "border-gray-200" },
} as const;

export const STATUS_CYCLE: Record<AttendeeStatus, AttendeeStatus> = {
  no_response: "coming",
  coming: "cancelled",
  cancelled: "no_response",
};
