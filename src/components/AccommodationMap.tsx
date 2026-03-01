import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mapLogoUrl from "@/assets/Map-Logo.png";
import { type Accommodation } from "@/hooks/useAccommodations";

// Fix for default marker icons in React-Leaflet
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

// Custom icon for campus - use Map-Logo asset

const campusIcon = L.icon({
  iconUrl: mapLogoUrl,
  // make icon wider than tall
  iconSize: [64, 48],
  iconAnchor: [32, 48],
  popupAnchor: [0, -48],
  className: "campus-marker",
});

// add dark-green filter to PNG
if (typeof document !== "undefined" && !document.querySelector(".campus-marker-style")) {
  const style = document.createElement("style");
  style.className = "campus-marker-style";
  style.textContent = `
    .campus-marker img {
      filter: hue-rotate(100deg) saturate(4) brightness(0.7);
    }
  `;
  document.head.appendChild(style);
}

interface AccommodationMapProps {
  items: Accommodation[];
  userLocation: { lat: number; lng: number } | null;
}

export function AccommodationMap({ items, userLocation }: AccommodationMapProps) {
  // Christ University Central Campus location - Hosur Main Road, Bangalore
  const campusCenterLat = 12.9362362;
  const campusCenterLng = 77.6061888;
  
  let center: [number, number] = [campusCenterLat, campusCenterLng];

  if (userLocation) {
    center = [userLocation.lat, userLocation.lng];
  }

  // Type cast to work around react-leaflet types issue
  const MapEl = MapContainer as any;
  const TileEl = TileLayer as any;

  return (
    <div className="w-full h-96 rounded-xl overflow-hidden border border-border shadow-lg">
      <MapEl 
        center={center}
        zoom={13} 
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
        <TileEl
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        {/* Campus Marker */}
        {/* @ts-ignore */}
        <Marker position={[12.9358, 77.6058]} icon={campusIcon}>
          <Popup>
            <div className="space-y-1">
              <p className="font-bold text-sm">Christ University</p>
              <p className="text-xs text-muted-foreground">Central Campus</p>
              <p className="text-xs">Hosur Main Road, Bangalore</p>
              <p className="text-xs text-muted-foreground">12.9358°N, 77.6058°E (inside campus)</p>
            </div>
          </Popup>
        </Marker>
      </MapEl>
    </div>
  );
}
