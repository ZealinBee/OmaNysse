import { ArrowLeft, AlertCircle } from "lucide-react";
import Link from "next/link";

export default function AuthCodeErrorPage() {
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

        <div className="text-center py-12">
          <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
            <AlertCircle className="w-8 h-8 text-red-400" />
          </div>
          <h1 className="text-white font-bold text-2xl mb-3">
            Kirjautuminen epäonnistui
          </h1>
          <p className="text-white/70 mb-8">
            Jokin meni pieleen kirjautumisen yhteydessä. Yritä uudelleen.
          </p>
          <Link
            href="/auth/login"
            className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white hover:bg-gray-100 rounded-xl font-bold text-sm text-[#1b57cf] transition-all"
          >
            Yritä uudelleen
          </Link>
        </div>
      </div>
    </main>
  );
}
