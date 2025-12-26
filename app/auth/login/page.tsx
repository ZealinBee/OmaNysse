"use client";

import { useState } from "react";
import { useAuth } from "@/app/lib/supabase/auth-context";
import { ArrowLeft, Mail, Loader2 } from "lucide-react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense } from "react";

function LoginForm() {
  const { signInWithGoogle, signInWithEmail } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") || "/plus";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error } = await signInWithEmail(email, password);

    if (error) {
      setError("Virheellinen sähköposti tai salasana");
      setLoading(false);
    } else {
      router.push(next);
    }
  };

  const handleGoogleLogin = async () => {
    setGoogleLoading(true);
    await signInWithGoogle();
  };

  const signupUrl = next !== "/plus" ? `/auth/signup?next=${encodeURIComponent(next)}` : "/auth/signup";

  return (
    <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
      <div className="max-w-md mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Takaisin
        </Link>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-2">
          Kirjaudu sisään
        </h1>
        <p className="text-white/70 text-base mb-8">
          Kirjaudu sisään käyttääksesi SeuraavaBussi Plus -ominaisuuksia
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
              Jatka Googlella
            </>
          )}
        </button>

        <div className="flex items-center gap-4 mb-4">
          <div className="flex-1 h-px bg-white/20" />
          <span className="text-white/50 text-sm">tai</span>
          <div className="flex-1 h-px bg-white/20" />
        </div>

        {/* Email Login Form */}
        <form onSubmit={handleEmailLogin} className="space-y-4">
          {error && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 rounded-xl">
              <p className="text-red-200 text-sm">{error}</p>
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-white/70 text-sm mb-2">
              Sähköposti
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="sinun@email.fi"
                required
                className="w-full py-3 px-4 pl-11 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
              />
            </div>
          </div>

          <div>
            <label htmlFor="password" className="block text-white/70 text-sm mb-2">
              Salasana
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              className="w-full py-3 px-4 bg-white/10 border border-white/20 rounded-xl text-white placeholder:text-white/40 focus:outline-none focus:border-white/40 transition-colors"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-white hover:bg-gray-100 rounded-xl font-bold text-sm text-[#1b57cf] transition-all disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              "Kirjaudu sisään"
            )}
          </button>
        </form>

        <p className="text-white/60 text-sm text-center mt-6">
          Ei vielä tiliä?{" "}
          <Link href={signupUrl} className="text-white hover:underline font-semibold">
            Luo tili
          </Link>
        </p>
      </div>
    </main>
  );
}

export default function LoginPage() {
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
      <LoginForm />
    </Suspense>
  );
}
