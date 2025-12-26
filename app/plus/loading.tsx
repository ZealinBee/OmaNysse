import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function PlusLoading() {
  return (
    <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Takaisin
        </Link>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3">
          SeuraavaBussi Plus
        </h1>
        <p className="text-white/70 text-base mb-8">
          Näe bussien ja ratikoiden sijainnit kartalla reaaliajassa
        </p>

        {/* HSL Notice skeleton */}
        <div className="mb-6 p-4 bg-yellow-500/20 border border-yellow-500/40 rounded-xl">
          <div className="h-4 bg-yellow-200/20 rounded animate-pulse w-3/4" />
        </div>

        {/* Pricing Cards skeleton */}
        <div className="grid gap-4 sm:grid-cols-2 mb-8">
          {/* Monthly card skeleton */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="h-6 bg-white/20 rounded animate-pulse w-1/3 mb-2" />
            <div className="h-8 bg-white/20 rounded animate-pulse w-1/2 mb-4" />
            <div className="h-12 bg-white/20 rounded-xl animate-pulse" />
          </div>

          {/* Lifetime card skeleton */}
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
            <div className="h-6 bg-white/20 rounded animate-pulse w-1/3 mb-2" />
            <div className="h-8 bg-white/20 rounded animate-pulse w-1/2 mb-4" />
            <div className="h-12 bg-white/20 rounded-xl animate-pulse" />
          </div>
        </div>

        {/* Terms skeleton */}
        <div className="pt-8 border-t border-white/20">
          <div className="h-6 bg-white/20 rounded animate-pulse w-1/4 mb-4" />
          <div className="space-y-3">
            <div className="h-4 bg-white/10 rounded animate-pulse w-full" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-5/6" />
            <div className="h-4 bg-white/10 rounded animate-pulse w-4/5" />
          </div>
        </div>
      </div>
    </main>
  );
}
