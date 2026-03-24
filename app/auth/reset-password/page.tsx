"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/lib/supabase/auth-context";
import { ArrowLeft, Loader2, Eye, EyeOff, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const t = useTranslations("auth");
  const { updatePassword, user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Redirect if no user (not coming from a valid reset link)
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/auth/forgot-password");
    }
  }, [authLoading, user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError(t("passwordsDontMatch"));
      return;
    }

    if (password.length < 6) {
      setError(t("passwordTooShort"));
      return;
    }

    setLoading(true);

    const { error } = await updatePassword(password);

    if (error) {
      setError(t("updatePasswordFailed"));
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  if (authLoading) {
    return (
      <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
        <div className="max-w-md mx-auto flex items-center justify-center min-h-[60vh]">
          <Loader2 className="w-8 h-8 text-white animate-spin" />
        </div>
      </main>
    );
  }

  if (success) {
    return (
      <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
            <h1 className="text-white font-bold text-2xl sm:text-3xl mb-2">
              {t("passwordUpdated")}
            </h1>
            <p className="text-white/70 text-base mb-8">
              {t("passwordUpdatedDescription")}
            </p>

            <Link
              href="/auth/login"
              className="inline-flex items-center justify-center w-full py-3 bg-white hover:bg-gray-100 rounded-xl font-bold text-sm text-[#1b57cf] transition-all"
            >
              {t("loginButton")}
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
          {t("resetPassword")}
        </h1>
        <p className="text-white/70 text-base mb-8">
          {t("resetPasswordDescription")}
        </p>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-white/70 text-sm mb-2">
              {t("newPassword")}
            </label>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("passwordPlaceholder")}
                required
                className="w-full py-3 px-4 pr-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-white/70 text-sm mb-2">
              {t("confirmPassword")}
            </label>
            <div className="relative">
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder={t("confirmPasswordPlaceholder")}
                required
                className="w-full py-3 px-4 pr-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white/70 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
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
              t("updatePasswordButton")
            )}
          </button>
        </form>
      </div>
    </main>
  );
}
