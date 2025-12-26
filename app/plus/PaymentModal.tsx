"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  priceType: "monthly" | "lifetime";
}

export function PaymentModal({ isOpen, onClose, priceType }: PaymentModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCheckout = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ priceType }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Maksun alustus epäonnistui");
      }

      // Redirect to Stripe Checkout
      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error("Checkout URL puuttuu");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Virhe tapahtui");
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-6 text-center">
          <h2 className="text-lg font-bold text-gray-900 mb-2">
            {priceType === "monthly" ? "Kuukausitilaus - 3€/kk" : "Kertamaksu - 30€"}
          </h2>
          <p className="text-gray-600 text-sm mb-6">
            Sinut ohjataan turvalliseen Stripe-maksusivulle.
          </p>

          {error && (
            <p className="text-red-600 text-sm mb-4">{error}</p>
          )}

          <div className="flex gap-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-semibold text-sm text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Peruuta
            </button>
            <button
              onClick={handleCheckout}
              disabled={isLoading}
              className="flex-1 px-4 py-3 bg-[#1b57cf] hover:bg-[#1545a3] rounded-xl font-semibold text-sm text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Ladataan...
                </>
              ) : (
                "Siirry maksamaan"
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
