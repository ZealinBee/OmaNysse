import { CheckCircle } from "lucide-react";
import Link from "next/link";

export default function PaymentSuccessPage() {
  return (
    <main className="min-h-screen bg-[#1b57cf] p-6 sm:p-10 flex items-center justify-center">
      <div className="max-w-md mx-auto text-center">
        <div className="w-20 h-20 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
          <CheckCircle className="w-10 h-10 text-green-400" />
        </div>

        <h1 className="text-white font-bold text-2xl sm:text-3xl mb-3">
          Maksu onnistui!
        </h1>

        <p className="text-white/70 text-base mb-8">
          Kiitos tilauksestasi! Sinulla on nyt pääsy SeuraavaBussi Plus
          -ominaisuuksiin.
        </p>

        <Link
          href="/"
          className="inline-block px-8 py-3 bg-white hover:bg-gray-100 rounded-xl font-bold text-sm text-[#1b57cf] transition-all"
        >
          Siirry etusivulle
        </Link>
      </div>
    </main>
  );
}
