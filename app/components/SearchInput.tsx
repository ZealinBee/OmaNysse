"use client";

import { useState, useEffect } from "react";
import { Search, X, MapPin, History } from "lucide-react";
import { GeocodedLocation } from "@/app/lib/types";

const RECENT_SEARCHES_KEY = "nysse-recent-searches";
const MAX_RECENT_SEARCHES = 5;

interface SearchInputProps {
  onLocationSelect: (location: GeocodedLocation) => void;
  placeholder?: string;
}

export default function SearchInput({
  onLocationSelect,
  placeholder = "Hae paikkaa...",
}: SearchInputProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<GeocodedLocation[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const [recentSearches, setRecentSearches] = useState<GeocodedLocation[]>([]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem(RECENT_SEARCHES_KEY);
    if (saved) {
      try {
        setRecentSearches(JSON.parse(saved));
      } catch {
        // Invalid data, ignore
      }
    }
  }, []);

  const searchLocations = async (query: string) => {
    if (query.trim().length < 2) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }

    setIsSearching(true);
    try {
      const response = await fetch(
        `/api/geocode?text=${encodeURIComponent(query)}&size=5`
      );
      if (!response.ok) throw new Error("Search failed");

      const data = await response.json();
      const features: GeocodedLocation[] = data.features || [];
      setSearchResults(features);
      setShowSearchResults(features.length > 0);
    } catch (err) {
      console.error("Search error:", err);
      setSearchResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  const saveToRecentSearches = (location: GeocodedLocation) => {
    const updated = [
      location,
      ...recentSearches.filter(
        (s) => s.properties.id !== location.properties.id
      ),
    ].slice(0, MAX_RECENT_SEARCHES);
    setRecentSearches(updated);
    localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
  };

  const handleSelect = (location: GeocodedLocation) => {
    saveToRecentSearches(location);
    onLocationSelect(location);
    setSearchQuery("");
    setShowSearchResults(false);
    setSearchResults([]);
  };

  const handleRecentSelect = (location: GeocodedLocation) => {
    onLocationSelect(location);
  };

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim()) {
        searchLocations(searchQuery);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  return (
    <div className="relative w-full">
      <div className="flex items-center bg-white/20 rounded-xl px-4 py-3">
        <Search className="w-5 h-5 text-white/60 mr-3" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder={placeholder}
          className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-base"
        />
        {searchQuery && (
          <button
            onClick={() => {
              setSearchQuery("");
              setSearchResults([]);
              setShowSearchResults(false);
            }}
            className="p-1 hover:bg-white/10 rounded-full"
          >
            <X className="w-4 h-4 text-white/60" />
          </button>
        )}
      </div>
      {showSearchResults && searchResults.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg overflow-hidden z-10">
          {searchResults.map((result) => (
            <button
              key={result.properties.id}
              onClick={() => handleSelect(result)}
              className="w-full px-4 py-3 text-left hover:bg-gray-100 flex items-center gap-3 border-b border-gray-100 last:border-0"
            >
              <MapPin className="w-5 h-5 text-gray-400 flex-shrink-0" />
              <span className="text-gray-800 text-sm truncate">
                {result.properties.label}
              </span>
            </button>
          ))}
        </div>
      )}
      {isSearching && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-lg p-4 text-center text-gray-500 text-sm">
          Haetaan...
        </div>
      )}
      {recentSearches.length > 0 && !showSearchResults && !isSearching && (
        <div className="mt-3 flex flex-wrap gap-2">
          {recentSearches.map((location) => (
            <button
              key={location.properties.id}
              onClick={() => handleRecentSelect(location)}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-white/15 hover:bg-white/25 rounded-lg text-white/90 text-sm transition-colors"
            >
              <History className="w-3.5 h-3.5 text-white/60" />
              <span className="truncate max-w-[150px]">
                {location.properties.name || location.properties.label.split(",")[0]}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
