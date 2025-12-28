"use client";

import { useState, useEffect } from "react";
import { Plus, Share, X, MoreVertical } from "lucide-react";

// Type declaration for beforeinstallprompt event
interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

type Platform = "ios" | "android" | "desktop" | "unknown";

export default function AddToHomeScreenButton() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [platform, setPlatform] = useState<Platform>("unknown");
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstructions, setShowInstructions] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);

    // Check if already running as standalone (installed)
    const standalone = window.matchMedia("(display-mode: standalone)").matches
      || (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
    setIsStandalone(standalone);

    if (standalone) return;

    // Detect platform
    const userAgent = navigator.userAgent.toLowerCase();
    if (/ipad|iphone|ipod/.test(userAgent)) {
      setPlatform("ios");
    } else if (/android/.test(userAgent)) {
      setPlatform("android");
    } else if (/mobile|tablet/.test(userAgent)) {
      setPlatform("android"); // Treat other mobile as Android-like
    } else {
      setPlatform("desktop");
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

  const handleClick = async () => {
    if (deferredPrompt) {
      // Chrome/Edge - use native prompt
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === "accepted") {
        setDeferredPrompt(null);
        setIsStandalone(true);
      }
    } else {
      // Show manual instructions
      setShowInstructions(true);
    }
  };

  // Don't render until mounted (to avoid hydration mismatch)
  if (!mounted) return null;

  // Don't render if already installed
  if (isStandalone) return null;

  // Don't show on desktop (unless they have beforeinstallprompt)
  if (platform === "desktop" && !deferredPrompt) return null;

  return (
    <>
      <button
        onClick={handleClick}
        className="inline-flex items-center gap-2 px-5 py-2.5 bg-white/15 hover:bg-white/25 border border-white/20 rounded-full text-white font-medium text-sm transition-all"
      >
        <Plus className="w-4 h-4" />
        Lisää aloitusnäytölle
      </button>

      {/* Instructions Modal */}
      {showInstructions && (
        <div
          className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-50 p-4"
          onClick={() => setShowInstructions(false)}
        >
          <div
            className="bg-white rounded-2xl w-full max-w-md shadow-xl animate-in slide-in-from-bottom-4 duration-300"
            onClick={(e) => e.stopPropagation()}
          >
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
                      Lisää aloitusnäytölle
                    </h2>
                    <p className="text-gray-500 text-sm">
                      SeuraavaBussi.fi
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowInstructions(false)}
                  className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                  aria-label="Sulje"
                >
                  <X className="w-5 h-5 text-gray-400" />
                </button>
              </div>

              {/* Platform-specific instructions */}
              <div className="bg-gray-50 rounded-xl p-4 mb-5">
                {platform === "ios" ? (
                  <>
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
                  </>
                ) : (
                  <>
                    <p className="text-sm text-gray-700 font-medium mb-3">
                      Lisää kotinäytölle Chromessa:
                    </p>
                    <ol className="text-sm text-gray-600 space-y-2">
                      <li className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">1</span>
                        <span>Napauta <MoreVertical className="w-4 h-4 inline text-gray-600" /> valikkopainiketta</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">2</span>
                        <span>Valitse &quot;Lisää aloitusnäytölle&quot;</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="bg-blue-100 text-blue-700 w-5 h-5 rounded-full flex items-center justify-center text-xs font-medium">3</span>
                        <span>Napauta &quot;Lisää&quot;</span>
                      </li>
                    </ol>
                  </>
                )}
              </div>

              {/* Actions */}
              <button
                onClick={() => setShowInstructions(false)}
                className="w-full px-4 py-3 bg-blue-500 text-white font-medium rounded-xl hover:bg-blue-600 transition-colors"
              >
                Selvä!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
