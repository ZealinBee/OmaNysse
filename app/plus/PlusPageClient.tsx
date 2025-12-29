"use client";

import { useTranslations } from "next-intl";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { PricingCards } from "./PricingCards";

export function PlusPageClient() {
  const t = useTranslations("plus");

  return (
    <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10">
      <div className="max-w-2xl mx-auto">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/70 hover:text-white font-bold text-sm transition-colors mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          {t("back")}
        </Link>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3">
          {t("title")}
        </h1>
        <p className="text-white/70 text-base mb-8">
          {t("description")}
        </p>

        {/* Supported Cities */}
        <div className="mb-6 p-4 bg-green-500/20 border border-green-500/40 rounded-xl">
          <p className="text-green-200 text-sm">
            <strong>{t("supportedCities")}:</strong> {t("supportedCitiesList")}
          </p>
          <p className="text-green-200/70 text-xs mt-2">
            {t("otherCitiesNote")}
          </p>
        </div>

        {/* Pricing Cards */}
        <PricingCards />

        {/* Terms of Service */}
        <section className="mb-8 pt-8 border-t border-white/20">
          <h2 className="text-white font-bold text-lg sm:text-xl mb-4">
            {t("termsOfService")}
          </h2>

          <div className="space-y-6 text-white/80 text-sm">
            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section1Title")}</h3>
              <p>{t("tos.section1Text")}</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section2Title")}</h3>
              <p>
                {t("tos.section2Text")} <strong>{t("tos.section2Bold")}</strong>
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section3Title")}</h3>
              <p className="mb-2">{t("tos.section3Text")}</p>
              <ul className="list-disc list-inside space-y-1 ml-2">
                <li>{t("tos.section3Item1")}</li>
                <li>{t("tos.section3Item2")}</li>
                <li>{t("tos.section3Item3")}</li>
                <li>{t("tos.section3Item4")}</li>
                <li>{t("tos.section3Item5")}</li>
              </ul>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section4Title")}</h3>
              <p>{t("tos.section4Text")}</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section5Title")}</h3>
              <p>{t("tos.section5Text")}</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section6Title")}</h3>
              <p className="mb-2">
                <strong>{t("tos.section6Monthly")}</strong> {t("tos.section6MonthlyText")}
              </p>
              <p>
                <strong>{t("tos.section6Lifetime")}</strong> {t("tos.section6LifetimeText")}{" "}
                <a href="mailto:zhiyuan.liu023@gmail.com" className="underline hover:text-white">
                  zhiyuan.liu023@gmail.com
                </a>.
              </p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section7Title")}</h3>
              <p>{t("tos.section7Text")}</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section8Title")}</h3>
              <p>{t("tos.section8Text")}</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section9Title")}</h3>
              <p>{t("tos.section9Text")}</p>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section10Title")}</h3>
              <div className="space-y-1">
                <p className="font-semibold">{t("tos.section10Company")}</p>
                <p>{t("tos.section10BusinessId")}</p>
                <p>{t("tos.section10Address")}</p>
                <p>
                  {t("tos.section10Email")}{" "}
                  <a
                    href="mailto:zhiyuan.liu023@gmail.com"
                    className="underline hover:text-white"
                  >
                    zhiyuan.liu023@gmail.com
                  </a>
                </p>
              </div>
            </div>

            <div>
              <h3 className="text-white font-semibold mb-2">{t("tos.section11Title")}</h3>
              <p>{t("tos.section11Text")}</p>
            </div>
          </div>
        </section>

        {/* Links */}
        <section className="mb-8 pt-4 border-t border-white/20">
          <div className="flex flex-col gap-2">
            <Link
              href="/tietosuoja"
              className="text-white/60 hover:text-white text-sm transition-colors"
            >
              {t("privacyPolicy")} →
            </Link>
          </div>
        </section>

        <div className="pt-4 border-t border-white/20">
          <p className="text-white/40 text-xs mb-4">
            {t("updated")}: {new Date().toLocaleDateString("fi-FI")}
          </p>
          <Link
            href="/"
            className="text-white/70 hover:text-white font-bold text-sm transition-colors"
          >
            ← {t("backToHome")}
          </Link>
        </div>
      </div>
    </main>
  );
}
