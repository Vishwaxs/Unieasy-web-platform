import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import mapLogoUrl from "@/assets/Map-Logo.png";
import { type Accommodation } from "@/hooks/useAccommodations";
import { useEffect } from "react";


delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.9.4/images/marker-shadow.png",
});



const campusIcon = L.icon({
  iconUrl: mapLogoUrl,
 
  iconSize: [64, 48],
  iconAnchor: [32, 48],
  popupAnchor: [0, -48],
  className: "campus-marker",
});


const redPointerIcon = L.icon({
  iconUrl: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath d='M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z' fill='%237c3aed'/%3E%3Ccircle cx='12' cy='9' r='2.5' fill='white'/%3E%3C/svg%3E",
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

interface AccommodationMapProps {
  items: Accommodation[];
  userLocation: { lat: number; lng: number } | null;
}


function BoundsController({ items }: { items: Accommodation[] }) {
  const map = useMap();
  useEffect(() => {
    if (!map) return;
    const group = L.featureGroup();

   
    group.addLayer(L.marker([12.9358, 77.6058]));

    items.forEach((i) => {
      group.addLayer(L.marker([i.lat, i.lng]));
    });

    const bounds = group.getBounds();
    if (bounds.isValid()) {
      map.fitBounds(bounds.pad(0.3), { maxZoom: 17 });
    }
  }, [items, map]);
  return null;
}

export function AccommodationMap({ items, userLocation }: AccommodationMapProps) {

  const campusCenterLat = 12.9362362;
  const campusCenterLng = 77.6061888;
  
  let center: [number, number] = [campusCenterLat, campusCenterLng];

  if (userLocation) {
    center = [userLocation.lat, userLocation.lng];
  }

 
  const MapEl = MapContainer as any;
  const TileEl = TileLayer as any;
  const MarkerEl = Marker as any;

  return (
    <div className="w-full h-[30rem] rounded-xl overflow-hidden border border-border shadow-lg">
      <MapEl 
        center={center}
        zoom={20} 
        scrollWheelZoom={true}
        style={{ width: "100%", height: "100%" }}
      >
       
        <BoundsController items={items} />

        <TileEl
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution="&copy; OpenStreetMap contributors"
        />

        <MarkerEl position={[12.9358, 77.6058] as any} icon={campusIcon as any}>
          <Popup>
            <div className="space-y-1">
              <p className="font-bold text-sm">Christ University</p>
              <p className="text-xs text-muted-foreground">Central Campus</p>
              <p className="text-xs">Hosur Main Road, Bangalore</p>
              <p className="text-xs text-muted-foreground">12.9358°N, 77.6058°E (inside campus)</p>
            </div>
          </Popup>
        </MarkerEl>

      
        {items.map((loc) => {
            
            return (
              <MarkerEl key={loc.id} position={[loc.lat, loc.lng] as any} icon={redPointerIcon as any}>
                <Popup>
                  <div className="space-y-1">
                    <p className="font-semibold text-sm">{loc.name}</p>
                    <p className="text-xs text-muted-foreground">{loc.type}</p>
                    <p className="text-sm font-bold text-primary">₹{loc.price.toLocaleString()}/month</p>
                  </div>
                </Popup>
              </MarkerEl>
            );
          })}
      </MapEl>
    </div>
  );
}
