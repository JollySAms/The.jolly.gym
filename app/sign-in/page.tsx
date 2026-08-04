"use client";

import { useAuthActions } from "@convex-dev/auth/react";
import { useState } from "react";

export default function SignInPage() {
  const { signIn } = useAuthActions();
  const [step, setStep] = useState<"email" | { email: string }>("email");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  return (
    <div className="min-h-screen bg-[#2D3F5A] flex items-center justify-center px-4">
      <div className="w-full max-w-sm">
        {/* Logo / brand */}
        <div className="text-center mb-10">
          <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-white/10 flex items-center justify-center">
            <img
              src="/icon-192.png"
              alt="The Jolly Gym"
              className="w-16 h-16 rounded-xl"
            />
          </div>
          <h1 className="text-2xl font-bold text-white tracking-tight">
            The Jolly Gym
          </h1>
          <p className="text-sm text-white/60 mt-1 uppercase tracking-widest font-medium">
            Not Weak
          </p>
        </div>

        {/* Sign-in form */}
        <div className="bg-white rounded-2xl p-6 shadow-xl">
          {step === "email" ? (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                const email = (formData.get("email") as string).toLowerCase().trim();
                formData.set("email", email);
                try {
                  await signIn("resend-otp", formData);
                  setStep({ email });
                } catch {
                  setError("Kon geen code versturen. Probeer het opnieuw.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                E-mailadres
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="jouw@email.nl"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D3F5A]/30 focus:border-[#2D3F5A] text-base"
              />
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-[#2D3F5A] text-white font-semibold text-sm hover:bg-[#243348] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Code versturen..." : "Verstuur code"}
              </button>
            </form>
          ) : (
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setError("");
                setLoading(true);
                const formData = new FormData(e.currentTarget);
                try {
                  await signIn("resend-otp", formData);
                } catch {
                  setError("Ongeldige code. Probeer het opnieuw.");
                } finally {
                  setLoading(false);
                }
              }}
            >
              <p className="text-sm text-gray-600 mb-4">
                We hebben een code gestuurd naar{" "}
                <span className="font-semibold text-gray-900">
                  {step.email}
                </span>
              </p>
              <label
                htmlFor="code"
                className="block text-sm font-medium text-gray-700 mb-2"
              >
                Inlogcode
              </label>
              <input
                id="code"
                name="code"
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                autoComplete="one-time-code"
                required
                placeholder="123456"
                className="w-full px-4 py-3 rounded-xl border border-gray-200 text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#2D3F5A]/30 focus:border-[#2D3F5A] text-base text-center tracking-[0.3em] font-mono text-lg"
              />
              <input name="email" value={step.email} type="hidden" />
              {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
              )}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-4 py-3 rounded-xl bg-[#2D3F5A] text-white font-semibold text-sm hover:bg-[#243348] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Inloggen..." : "Inloggen"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("email");
                  setError("");
                }}
                className="w-full mt-2 py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                Ander e-mailadres
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
