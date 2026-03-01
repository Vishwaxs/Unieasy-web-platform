import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useMemo } from "react";
import mapLogoUrl from "@/assets/Map-Logo.png";
import { type FoodItem } from "@/hooks/useFoodItems";

const iconDefaultPrototype = L.Icon.Default.prototype as L.Icon.Default & { _getIconUrl?: unknown };
delete iconDefaultPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});

const CAMPUS_POSITION: [number, number] = [12.9358, 77.6058];

const campusIcon = L.icon({
  iconUrl: mapLogoUrl,
  iconSize: [64, 48],
  iconAnchor: [32, 48],
  popupAnchor: [0, -48],
  className: "campus-marker",
});

const foodPointerIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='%23d97706'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='white'/%3E%3C/svg%3E",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

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

interface FoodMapProps {
  items: FoodItem[];
}

interface MarkerFoodItem {
  id: string;
  name: string;
  restaurant: string;
  isVeg: boolean;
  price: number;
  position: [number, number];
}

function fallbackPosition(seed: string): [number, number] {
  const hash = seed.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
  const angle = ((hash * 67) % 360) * (Math.PI / 180);
  const latOffset = Math.cos(angle) * (0.004 + (hash % 3) * 0.001);
  const lngOffset = Math.sin(angle) * (0.005 + (hash % 2) * 0.001);
  return [CAMPUS_POSITION[0] + latOffset, CAMPUS_POSITION[1] + lngOffset];
}

function BoundsController({ markers }: { markers: MarkerFoodItem[] }) {
  const map = useMap();

  useEffect(() => {
    const group = L.featureGroup();
    group.addLayer(L.marker(CAMPUS_POSITION));
    markers.forEach((item) => group.addLayer(L.marker(item.position)));

    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.3), { maxZoom: 17 });
    }
  }, [map, markers]);

  return null;
}

export function FoodMap({ items }: FoodMapProps) {
  const markers = useMemo<MarkerFoodItem[]>(
    () =>
      items.map((item) => {
        const lat = typeof item.lat === "number" ? item.lat : Number(item.lat);
        const lng = typeof item.lng === "number" ? item.lng : Number(item.lng);
        const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

        return {
          id: item.id,
          name: item.name,
          restaurant: item.restaurant,
          isVeg: item.is_veg,
          price: item.price,
          position: hasCoords ? [lat, lng] : fallbackPosition(item.id),
        };
      }),
    [items],
  );

  return (
    <div className="w-full h-[30rem] rounded-xl overflow-hidden border border-border shadow-lg">
      <MapContainer
        center={CAMPUS_POSITION}
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
              <p className="font-bold text-sm">Christ University</p>
              <p className="text-xs text-muted-foreground">Central Campus</p>
              <p className="text-xs">Hosur Main Road, Bangalore</p>
            </div>
          </Popup>
        </Marker>

        {markers.map((marker) => (
          <Marker key={marker.id} position={marker.position} icon={foodPointerIcon}>
            <Popup>
              <div className="space-y-1">
                <p className="font-semibold text-sm">{marker.name}</p>
                <p className="text-xs text-muted-foreground">{marker.restaurant}</p>
                <p className="text-xs text-muted-foreground">{marker.isVeg ? "Veg" : "Non-Veg"}</p>
                <p className="text-sm font-bold text-primary">₹{marker.price}</p>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}
