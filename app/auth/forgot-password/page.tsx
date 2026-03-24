"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/lib/supabase/auth-context";
import { ArrowLeft, Mail, Loader2, CheckCircle } from "lucide-react";
import Link from "next/link";

export default function ForgotPasswordPage() {
  const t = useTranslations("auth");
  const { resetPasswordForEmail } = useAuth();

  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await resetPasswordForEmail(email);

    if (error) {
      setError(t("resetPasswordFailed"));
      setLoading(false);
    } else {
      setEmailSent(true);
      setLoading(false);
    }
  };

  if (emailSent) {
    return (
      <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
        <div className="max-w-md mx-auto">
          <Link
            href="/auth/login"
            className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
          >
            <ArrowLeft className="w-4 h-4" />
            {t("back")}
          </Link>

          <div className="text-center">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-white font-bold text-2xl sm:text-3xl mb-2">
              {t("checkEmail")}
            </h1>
            <p className="text-white/70 text-base mb-2">
              {t("resetEmailSent")}
            </p>
            <p className="text-white font-semibold mb-6">{email}</p>
            <p className="text-white/60 text-sm mb-8">
              {t("clickResetLink")}
            </p>

            <Link
              href="/auth/login"
              className="inline-flex items-center gap-2 text-white hover:underline font-semibold"
            >
              <ArrowLeft className="w-4 h-4" />
              {t("backToLogin")}
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
      <div className="max-w-md mx-auto">
        <Link
          href="/auth/login"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-2">
          {t("forgotPassword")}
        </h1>
        <p className="text-white/70 text-base mb-8">
          {t("forgotPasswordDescription")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-white/70 text-sm mb-2">
              {t("email")}
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("emailPlaceholder")}
                required
                className="w-full py-3 px-4 pl-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-100 rounded-xl font-bold text-sm text-[#1b57cf] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              t("sendResetLink")
            )}
          </button>
        </form>

        <p className="text-white/60 text-sm text-center mt-6">
          {t("rememberPassword")}{" "}
          <Link href="/auth/login" className="text-white hover:underline font-semibold">
            {t("loginButton")}
          </Link>
        </p>
      </div>
    </main>
  );
}
