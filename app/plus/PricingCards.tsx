"use client";

import { useState } from "react";
import { useAuth } from "@/app/lib/supabase/auth-context";
import { useSubscription } from "@/app/lib/hooks/useSubscription";
import { Check, Loader2, LogOut, Settings } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export function PricingCards() {
  const { user, loading, signOut } = useAuth();
  const { subscription, isLoading: subLoading, hasPlusAccess } = useSubscription();
  const router = useRouter();
  const [isCheckingOut, setIsCheckingOut] = useState<"monthly" | "lifetime" | null>(null);
  const [isOpeningPortal, setIsOpeningPortal] = useState(false);

  const handleSwitchAccount = async () => {
    await signOut();
    router.push("/auth/signup?next=/plus");
  };

  const handleSubscribe = async (type: "monthly" | "lifetime") => {
    setIsCheckingOut(type);
    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceType: type }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        console.error("No checkout URL returned:", data);
        setIsCheckingOut(null);
      }
    } catch (error) {
      console.error("Checkout error:", error);
      setIsCheckingOut(null);
    }
  };

  const handleManageSubscription = async () => {
    setIsOpeningPortal(true);
    try {
      const response = await fetch("/api/stripe/customer-portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ returnUrl: window.location.href }),
      });
      const data = await response.json();
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (error) {
      console.error("Failed to open customer portal:", error);
      setIsOpeningPortal(false);
    }
  };

  const renderButton = (type: "monthly" | "lifetime", className: string) => {
    if (loading || subLoading) {
      return (
        <button className={className} disabled>
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        </button>
      );
    }

    if (!user) {
      return (
        <Link
          href="/auth/signup?next=/plus"
          className={`${className} block text-center`}
        >
          Luo tili ostaaksesi
        </Link>
      );
    }

    // User has Plus access
    if (hasPlusAccess) {
      if (subscription?.type === type) {
        return (
          <button
            className={className}
            onClick={handleManageSubscription}
            disabled={isOpeningPortal}
          >
            {isOpeningPortal ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              <>
                <Settings className="w-4 h-4 inline mr-2" />
                Hallinnoi tilausta
              </>
            )}
          </button>
        );
      }
      return (
        <button className={className} disabled>
          {type === "lifetime"
            ? "Sinulla on jo tilaus"
            : "Sinulla on ikuinen käyttöoikeus"}
        </button>
      );
    }

    // User can subscribe
    const isLoading = isCheckingOut === type;
    return (
      <button
        className={className}
        onClick={() => handleSubscribe(type)}
        disabled={isCheckingOut !== null}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin mx-auto" />
        ) : (
          type === "monthly" ? "Tilaa 3€/kk" : "Osta 30€"
        )}
      </button>
    );
  };

  return (
    <>
      <section className="mb-10">
        <h2 className="text-white font-bold text-lg mb-4">Valitse tilaus</h2>

        {user && (
          <div className="mb-4 p-3 bg-green-500/20 border border-green-500/40 rounded-xl flex items-center justify-between gap-3">
            <p className="text-green-200 text-sm truncate">
              Kirjautuneena: <strong>{user.email}</strong>
            </p>
            <button
              onClick={handleSwitchAccount}
              className="flex items-center gap-1.5 text-green-200/70 hover:text-green-200 text-sm transition-colors flex-shrink-0"
            >
              <LogOut className="w-3.5 h-3.5" />
              Vaihda tili
            </button>
          </div>
        )}

        {hasPlusAccess && subscription && (
          <div className="mb-4 p-4 bg-white/10 border border-white/20 rounded-xl">
            <p className="text-white font-semibold mb-1">
              Sinulla on SeuraavaBussi Plus
            </p>
            <p className="text-white/70 text-sm">
              {subscription.type === "lifetime"
                ? "Ikuinen käyttöoikeus"
                : subscription.cancelAtPeriodEnd
                  ? `Tilaus päättyy ${new Date(subscription.currentPeriodEnd!).toLocaleDateString("fi-FI")}`
                  : `Tilaus uusiutuu ${new Date(subscription.currentPeriodEnd!).toLocaleDateString("fi-FI")}`}
            </p>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Monthly */}
          <div className="rounded-2xl bg-white/10 border border-white/20 p-5">
            <p className="text-white/60 text-sm mb-1">Kuukausitilaus</p>
            <p className="text-white font-bold text-3xl mb-1">
              3€<span className="text-lg font-normal text-white/60">/kk</span>
            </p>
            <p className="text-white/50 text-xs mb-4">
              Peruutettavissa milloin vain
            </p>
            <ul className="space-y-2 mb-5">
              <li className="flex items-center gap-2 text-white/80 text-sm">
                <Check className="w-4 h-4 text-white/60" />
                Rajaton karttakäyttö
              </li>
              <li className="flex items-center gap-2 text-white/80 text-sm">
                <Check className="w-4 h-4 text-white/60" />
                Nopeampi päivitysväli (10 s)
              </li>
              <li className="flex items-center gap-2 text-white/80 text-sm">
                <Check className="w-4 h-4 text-white/60" />
                Tulevat ominaisuudet
              </li>
            </ul>
            {renderButton(
              "monthly",
              "w-full py-3 bg-white/20 hover:bg-white/30 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          </div>

          {/* Lifetime */}
          <div className="rounded-2xl bg-white border border-white/20 p-5">
            <p className="text-gray-500 text-sm mb-1">Kertamaksu</p>
            <p className="text-gray-900 font-bold text-3xl mb-1">
              30€<span className="text-lg font-normal text-gray-400"> kerran</span>
            </p>
            <p className="text-gray-400 text-xs mb-4">Ikuinen käyttöoikeus</p>
            <ul className="space-y-2 mb-5">
              <li className="flex items-center gap-2 text-gray-700 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                Rajaton karttakäyttö
              </li>
              <li className="flex items-center gap-2 text-gray-700 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                Nopeampi päivitysväli (10 s)
              </li>
              <li className="flex items-center gap-2 text-gray-700 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                Kaikki tulevat ominaisuudet
              </li>
              <li className="flex items-center gap-2 text-gray-700 text-sm">
                <Check className="w-4 h-4 text-green-500" />
                Ei toistuvia maksuja
              </li>
            </ul>
            {renderButton(
              "lifetime",
              "w-full py-3 bg-[#1b57cf] hover:bg-[#1548b0] rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            )}
          </div>
        </div>

        {/* 7-day money-back guarantee for lifetime */}
        <div className="mt-4 text-center">
          <p className="text-white/70 text-sm">
            Kertamaksulle 7 päivän rahat takaisin -takuu.
          </p>
        </div>

        {!loading && !user && (
          <div className="mt-6 text-center">
            <p className="text-white/60 text-sm mb-2">
              Oletko jo ostanut Plus-tilauksen?
            </p>
            <Link
              href="/auth/login?next=/plus"
              className="text-white font-semibold text-sm hover:underline"
            >
              Palauta ostos kirjautumalla
            </Link>
          </div>
        )}
      </section>
    </>
  );
}
