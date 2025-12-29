"use client";

import { useState, Suspense } from "react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/app/lib/supabase/auth-context";
import { ArrowLeft, Mail, Loader2, Check, Eye, EyeOff } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

function SignupForm() {
  const t = useTranslations("auth");
  const { signInWithGoogle, signUpWithEmail } = useAuth();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/plus";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const loginUrl = next !== "/plus" ? `/auth/login?next=${encodeURIComponent(next)}` : "/auth/login";

  const handleEmailSignup = async (e: React.FormEvent) => {
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

    const { error } = await signUpWithEmail(email, password);

    if (error) {
      setError(t("signupFailed"));
      setLoading(false);
    } else {
      setSuccess(true);
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signInWithGoogle(next);
  };

  if (success) {
    return (
      <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
        <div className="max-w-md mx-auto">
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <h1 className="text-white font-bold text-2xl mb-3">
              {t("checkEmail")}
            </h1>
            <p className="text-white/70 mb-8">
              {t("emailSent")} <strong className="text-white">{email}</strong>.
              {" "}{t("clickLink")}
            </p>
            <Link
              href={loginUrl}
              className="inline-flex items-center gap-2 text-white font-semibold hover:underline"
            >
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
          href="/plus"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-2">
          {t("createAccount")}
        </h1>
        <p className="text-white/70 text-base mb-8">
          {t("createAccountDescription")}
        </p>

        {/* Google Login */}
        <button
          onClick={handleGoogleLogin}
          disabled={googleLoading}
          className="w-full py-3 px-4 bg-white hover:bg-gray-50 rounded-xl font-semibold text-sm text-gray-800 transition-all flex items-center justify-center gap-3 mb-4 disabled:opacity-50"
        >
          {googleLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <>
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              {t("continueWithGoogle")}
            </>
          )}
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/50 text-sm">{t("or")}</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Email Signup Form */}
        <form onSubmit={handleEmailSignup} className="space-y-4">
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

          <div>
            <label htmlFor="password" className="block text-white/70 text-sm mb-2">
              {t("password")}
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
              t("createAccountButton")
            )}
          </button>
        </form>

        <p className="text-white/60 text-sm text-center mt-6">
          {t("hasAccount")}{" "}
          <Link href={loginUrl} className="text-white hover:underline font-semibold">
            {t("login")}
          </Link>
        </p>

        <p className="text-white/40 text-xs text-center mt-8">
          {t("bySigningUp")}{" "}
          <Link href="/plus" className="underline hover:text-white/60">
            {t("termsOfService")}
          </Link>{" "}
          {t("and")}{" "}
          <Link href="/tietosuoja" className="underline hover:text-white/60">
            {t("privacyPolicy")}
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function SignupPage() {
  return (
    <Suspense fallback={
      <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
        <div className="max-w-md mx-auto">
          <div className="animate-pulse">
            <div className="h-8 bg-white/10 rounded w-24 mb-8" />
            <div className="h-10 bg-white/10 rounded w-48 mb-2" />
            <div className="h-6 bg-white/10 rounded w-64 mb-8" />
          </div>
        </div>
      </main>
    }>
      <SignupForm />
    </Suspense>
  );
}
