"use client";

import { useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Loader2, AlertCircle, CheckCircle } from "lucide-react";

interface PaymentFormProps {
  priceType: "monthly" | "lifetime";
  onSuccess: () => void;
  onCancel: () => void;
}

export function PaymentForm({ priceType, onSuccess, onCancel }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);
    setError(null);

    const { error: submitError } = await elements.submit();

    if (submitError) {
      setError(submitError.message || "Maksun käsittely epäonnistui");
      setIsProcessing(false);
      return;
    }

    const { error: confirmError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/plus/success`,
      },
      redirect: "if_required",
    });

    if (confirmError) {
      setError(confirmError.message || "Maksun vahvistus epäonnistui");
      setIsProcessing(false);
    } else {
      setSuccess(true);
      setTimeout(onSuccess, 2000);
    }
  };

  if (success) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-green-500" />
        </div>
        <h3 className="text-xl font-bold text-gray-900 mb-2">
          Maksu onnistui!
        </h3>
        <p className="text-gray-600">
          {priceType === "lifetime"
            ? "Sinulla on nyt ikuinen Plus-käyttöoikeus."
            : "Tilauksesi on nyt aktiivinen."}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="bg-gray-50 rounded-xl p-4 mb-6">
        <p className="text-sm text-gray-600 mb-1">
          {priceType === "monthly" ? "Kuukausitilaus" : "Kertamaksu"}
        </p>
        <p className="text-2xl font-bold text-gray-900">
          {priceType === "monthly" ? "3€/kk" : "30€"}
        </p>
      </div>

      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          disabled={isProcessing}
          className="flex-1 py-3 border border-gray-300 rounded-xl font-semibold text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          Peruuta
        </button>
        <button
          type="submit"
          disabled={!stripe || isProcessing}
          className="flex-1 py-3 bg-[#1b57cf] hover:bg-[#1548b0] rounded-xl font-bold text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
        >
          {isProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Käsitellään...
            </>
          ) : (
            `Maksa ${priceType === "monthly" ? "3€" : "30€"}`
          )}
        </button>
      </div>

      <p className="text-xs text-gray-500 text-center">
        Maksut käsittelee turvallisesti Stripe. Korttitietosi eivät tallennu palvelimeemme.
      </p>
    </form>
  );
}
