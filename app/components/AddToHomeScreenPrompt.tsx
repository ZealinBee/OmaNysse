"use client";

import { useState, useEffect } from "react";
import { X, Plus, Share } from "lucide-react";

const VISIT_COUNT_KEY = "seuraavabussi_visit_count";
const PROMPT_DISMISSED_KEY = "seuraavabussi_a2hs_dismissed";
const VISITS_TO_TRIGGER = 3;

export default function AddToHomeScreenPrompt() {
  const [showPrompt, setShowPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if already running as standalone (installed)
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Check if iOS
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
    setIsIOS(iOS);

    // Check if prompt was already dismissed
    const dismissed = localStorage.getItem(PROMPT_DISMISSED_KEY);
    if (dismissed === "true") return;

    // Increment visit count
    const currentCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || "0", 10);
    const newCount = currentCount + 1;
    localStorage.setItem(VISIT_COUNT_KEY, newCount.toString());

    // Show prompt on 5th visit
    if (newCount >= VISITS_TO_TRIGGER) {
      setShowPrompt(true);
    }

    // Listen for beforeinstallprompt event (Chrome/Edge/etc)
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      // Chrome/Edge - use native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        handleDismiss();
      }
      setDeferredPrompt(null);
    }
    // For iOS, we just show instructions (the prompt itself has them)
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem(PROMPT_DISMISSED_KEY, "true");
  };

  if (!showPrompt || isStandalone) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in slide-in-from-bottom-4 duration-300">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl flex items-center justify-center">
                <img
                  src="/white%20logo%20bus.png"
                  alt="SeuraavaBussi"
                  className="h-7"
                />
              </div>
              <div>
                <h2 className="font-bold text-gray-900 text-lg">
                  Kiitos käytöstä!
                </h2>
                <p className="text-gray-500 text-sm">
                  SeuraavaBussi.fi
                </p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              aria-label="Sulje"
            >
              <X className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          {/* Content */}
          <p className="text-gray-600 mb-5">
            Laita SeuraavaBussi kotinäytölle, niin se on aina yhdessä napautuksessa         
           </p>

          {isIOS ? (
            // iOS instructions
            <div className="bg-gray-50 rounded-xl p-4 mb-5">
              <p className="text-sm text-gray-700 font-medium mb-3">
                Lisää kotinäytölle Safarissa:
              </p>
              <ol className="text-sm text-gray-600 space-y-2">
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                  <span>Napauta <Share className="w-4 h-4 inline text-blue-500" /> jakamispainiketta</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                  <span>Valitse &quot;Lisää kotivalikkoon&quot;</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                  <span>Napauta &quot;Lisää&quot;</span>
                </li>
              </ol>
            </div>
          ) : null}

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleDismiss}
              className="flex-1 px-4 py-3 text-gray-700 font-medium rounded-xl border border-gray-200 hover:bg-gray-50 transition-colors"
            >
              Ei kiitos
            </button>
            {!isIOS && deferredPrompt ? (
              <button
                onClick={handleInstall}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Lisää
              </button>
            ) : (
              <button
                onClick={handleDismiss}
                className="flex-1 px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
              >
                Selvä!
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// Type declaration for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}
