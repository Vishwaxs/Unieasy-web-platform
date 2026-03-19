import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mapLogoUrl from "@/assets/Map-Logo.png";
import { type Accommodation } from "@/hooks/useAccommodations";
import { useEffect, useMemo } from "react";

delete (L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown })
  ._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl:
    "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CAMPUS_POSITION: [number, number] = [12.9358, 77.6058];

const campusIcon = L.icon({
  iconUrl: mapLogoUrl,
  iconSize: [64, 48],
  iconAnchor: [32, 48],
  popupAnchor: [0, -48],
  className: "campus-marker",
});

const redPointerIcon = L.icon({
  iconUrl:
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='%237c3aed'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='white'/%3E%3C/svg%3E",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

if (
  typeof document !== "undefined" &&
  !document.querySelector(".campus-marker-style")
) {
  const style = document.createElement("style");
  style.className = "campus-marker-style";
  style.textContent = `
    .campus-marker img {
      filter: hue-rotate(100deg) saturate(4) brightness(0.7);
    }
  `;
  document.head.appendChild(style);
}

interface MarkerItem {
  id: string;
  name: string;
  type: string;
  price: number;
  position: [number, number];
}

function fallbackPosition(seed: string): [number, number] {
  const hash = seed
    .split("")
    .reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = ((hash * 67) % 360) * (Math.PI / 180);
  const latOffset = Math.cos(angle) * (0.004 + (hash % 3) * 0.001);
  const lngOffset = Math.sin(angle) * (0.005 + (hash % 2) * 0.001);
  return [CAMPUS_POSITION[0] + latOffset, CAMPUS_POSITION[1] + lngOffset];
}

interface AccommodationMapProps {
  items: Accommodation[];
  userLocation?: { lat: number; lng: number } | null;
}

function BoundsController({ markers }: { markers: MarkerItem[] }) {
  const map = useMap();
  useEffect(() => {
    const group = L.featureGroup();
    group.addLayer(L.marker(CAMPUS_POSITION));
    markers.forEach((m) => group.addLayer(L.marker(m.position)));
    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.3), { maxZoom: 17 });
    }
  }, [markers, map]);
  return null;
}

export function AccommodationMap({
  items,
  userLocation,
}: AccommodationMapProps) {
  const markers = useMemo<MarkerItem[]>(
    () =>
      items.map((item) => {
        const lat = typeof item.lat === "number" ? item.lat : Number(item.lat);
        const lng = typeof item.lng === "number" ? item.lng : Number(item.lng);
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);
        return {
          id: item.id,
          name: item.name,
          type: item.type,
          price: item.price,
          position: hasCoords ? [lat, lng] : fallbackPosition(item.id),
        };
      }),
    [items],
  );

  let center: [number, number] = CAMPUS_POSITION;
  if (userLocation) {
    center = [userLocation.lat, userLocation.lng];
  }

  return (
    <div className="w-full h-[30rem] rounded-xl overflow-hidden border border-border shadow-lg">
      <MapContainer
        center={center}
        zoom={15}
        scrollWheelZoom
        style={{ width: "100%", height: "100%" }}
      >
        <BoundsController markers={markers} />

        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <Marker position={CAMPUS_POSITION} icon={campusIcon}>
          <Popup>
            <div className="space-y-1">
              <p className="font-bold text-sm">CHRIST University</p>
              <p className="text-xs text-muted-foreground">Central Campus</p>
              <p className="text-xs">Hosur Main Road, Bangalore</p>
            </div>
          </Popup>
        </Marker>

        {markers.map((loc) => (
          <Marker key={loc.id} position={loc.position} icon={redPointerIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{loc.name}</p>
                <p className="text-xs text-muted-foreground">{loc.type}</p>
                <p className="text-sm font-bold text-primary">
                  ₹{loc.price.toLocaleString()}/month
                </p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
