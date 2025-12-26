"use client";

import { useEffect, useState, useRef } from "react";
import { X, Bus, MapPin, Navigation } from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

interface VehiclePosition {
  lat: number;
  lon: number;
  bearing?: number;
  vehicleRef?: string;
}

interface BusMapPopupProps {
  isOpen: boolean;
  onClose: () => void;
  routeNumber: string;
  headsign: string;
  routeColor: string;
  stopLat: number;
  stopLon: number;
  userLat: number;
  userLon: number;
  region: "hsl" | "waltti";
}

// Custom hook to fit bounds only on initial load
function FitBoundsOnce({ positions }: { positions: Array<[number, number]> }) {
  const map = useMap();
  const hasFitted = useRef(false);

  useEffect(() => {
    if (positions.length > 0 && !hasFitted.current) {
      const bounds = L.latLngBounds(positions.map(([lat, lon]) => [lat, lon]));
      map.fitBounds(bounds, { padding: [50, 50], maxZoom: 16 });
      hasFitted.current = true;
    }
  }, [map, positions]);

  return null;
}

// Create custom icons
function createBusIcon(color: string) {
  return L.divIcon({
    html: `<div style="background-color: ${color}; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
        <path d="M8 6v6"/>
        <path d="M15 6v6"/>
        <path d="M2 12h19.6"/>
        <path d="M18 18h3s.5-1.7.8-2.8c.1-.4.2-.8.2-1.2 0-.4-.1-.8-.2-1.2l-1.4-5C20.1 6.8 19.1 6 18 6H4a2 2 0 0 0-2 2v10h3"/>
        <circle cx="7" cy="18" r="2"/>
        <path d="M9 18h5"/>
        <circle cx="16" cy="18" r="2"/>
      </svg>
    </div>`,
    className: "",
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

const stopIcon = L.divIcon({
  html: `<div style="background-color: #ef4444; width: 28px; height: 28px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="white" stroke="white" stroke-width="2">
      <path d="M20 10c0 6-8 12-8 12s-8-6-8-12a8 8 0 0 1 16 0Z"/>
      <circle cx="12" cy="10" r="3" fill="#ef4444"/>
    </svg>
  </div>`,
  className: "",
  iconSize: [28, 28],
  iconAnchor: [14, 14],
});

const userIcon = L.divIcon({
  html: `<div style="background-color: #3b82f6; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; border: 3px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3);">
    <div style="width: 8px; height: 8px; background: white; border-radius: 50%;"></div>
  </div>`,
  className: "",
  iconSize: [24, 24],
  iconAnchor: [12, 12],
});

export default function BusMapPopup({
  isOpen,
  onClose,
  routeNumber,
  headsign,
  routeColor,
  stopLat,
  stopLon,
  userLat,
  userLon,
  region,
}: BusMapPopupProps) {
  const [vehiclePositions, setVehiclePositions] = useState<VehiclePosition[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const busIcon = useRef(createBusIcon(routeColor));

  useEffect(() => {
    if (!isOpen) return;

    const fetchVehiclePositions = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          `/api/vehicle-position?lineRef=${encodeURIComponent(routeNumber)}&region=${region}`
        );
        const data = await response.json();

        if (data.positions && data.positions.length > 0) {
          setVehiclePositions(data.positions);
        } else if (region === "hsl") {
          setError("HSL-alueella bussin sijainti ei ole saatavilla");
        } else {
          setError("Bussin sijaintia ei löytynyt");
        }
      } catch {
        setError("Bussin sijainnin haku epäonnistui");
      } finally {
        setIsLoading(false);
      }
    };

    fetchVehiclePositions();

    // Refresh every 10 seconds
    const interval = setInterval(fetchVehiclePositions, 10000);
    return () => clearInterval(interval);
  }, [isOpen, routeNumber, region]);

  // Update bus icon when color changes
  useEffect(() => {
    busIcon.current = createBusIcon(routeColor);
  }, [routeColor]);

  if (!isOpen) return null;

  // Compute bounds for all markers
  const allPositions: Array<[number, number]> = [
    [stopLat, stopLon],
    [userLat, userLon],
    ...vehiclePositions.map((v) => [v.lat, v.lon] as [number, number]),
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div
          className="flex items-center justify-between px-4 py-3"
          style={{ backgroundColor: routeColor }}
        >
          <div className="flex items-center gap-3">
            <span className="font-black text-white text-xl">{routeNumber}</span>
            <span className="text-white/90 font-medium truncate">{headsign}</span>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/20 hover:bg-white/30 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Map Container */}
        <div className="h-80 relative">
          {isLoading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-gray-100">
              <div className="flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-4 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
                <span className="text-gray-600 text-sm">Ladataan karttaa...</span>
              </div>
            </div>
          )}

          <MapContainer
            center={[stopLat, stopLon]}
            zoom={15}
            className="h-full w-full"
            zoomControl={false}
          >
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {/* Stop marker */}
            <Marker position={[stopLat, stopLon]} icon={stopIcon}>
              <Popup>
                <div className="font-semibold">Pysäkki</div>
              </Popup>
            </Marker>

            {/* User location marker */}
            <Marker position={[userLat, userLon]} icon={userIcon}>
              <Popup>
                <div className="font-semibold">Sijaintisi</div>
              </Popup>
            </Marker>

            {/* Bus markers */}
            {vehiclePositions.map((vehicle, index) => (
              <Marker
                key={vehicle.vehicleRef || index}
                position={[vehicle.lat, vehicle.lon]}
                icon={busIcon.current}
              >
                <Popup>
                  <div className="font-semibold">
                    {routeNumber} {headsign}
                  </div>
                  {vehicle.vehicleRef && (
                    <div className="text-xs text-gray-500">
                      Ajoneuvo: {vehicle.vehicleRef}
                    </div>
                  )}
                </Popup>
              </Marker>
            ))}

            <FitBoundsOnce positions={allPositions} />
          </MapContainer>
        </div>

        {/* Legend / Info */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200">
          {error ? (
            <div className="text-center text-gray-600 text-sm">{error}</div>
          ) : (
            <div className="flex items-center justify-center gap-6 text-xs text-gray-600">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-4 h-4 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: routeColor }}
                >
                  <Bus className="w-2.5 h-2.5 text-white" />
                </div>
                <span>Bussi ({vehiclePositions.length})</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-red-500 flex items-center justify-center">
                  <MapPin className="w-2.5 h-2.5 text-white" />
                </div>
                <span>Pysäkki</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-4 h-4 rounded-full bg-blue-500 flex items-center justify-center">
                  <Navigation className="w-2.5 h-2.5 text-white" />
                </div>
                <span>Sinä</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
