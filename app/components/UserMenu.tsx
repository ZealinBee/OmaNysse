"use client";

import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/lib/supabase/auth-context";
import { User, LogOut, Crown, ChevronDown, Loader2 } from "lucide-react";
import Link from "next/link";

export function UserMenu() {
  const { user, loading, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (loading) {
    return (
      <div className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center">
        <Loader2 className="w-5 h-5 text-white/50 animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <Link
        href="/auth/login"
        className="flex items-center gap-2 px-4 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-white text-sm font-semibold transition-colors"
      >
        <User className="w-4 h-4" />
        Kirjaudu
      </Link>
    );
  }

  const initials = user.email
    ? user.email.substring(0, 2).toUpperCase()
    : "??";

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-white/10 hover:bg-white/20 rounded-xl transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-white/20 flex items-center justify-center text-white text-xs font-bold">
          {initials}
        </div>
        <ChevronDown className={`w-4 h-4 text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl overflow-hidden z-50">
          <div className="p-3 border-b border-gray-100">
            <p className="text-gray-900 font-semibold text-sm truncate">
              {user.email}
            </p>
          </div>

          <div className="p-1">
            <Link
              href="/plus"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <Crown className="w-4 h-4 text-[#1b57cf]" />
              <span className="text-sm font-medium">SeuraavaBussi Plus</span>
            </Link>

            <button
              onClick={handleSignOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-4 h-4 text-gray-400" />
              <span className="text-sm font-medium">Kirjaudu ulos</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
