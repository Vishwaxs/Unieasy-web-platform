import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useActiveAds, trackImpression } from "@/hooks/useActiveAds";

const AdsCarousel = () => {
  const { data: ads } = useActiveAds();
  const [current, setCurrent] = useState(0);

  const activeAds = ads?.slice(0, 3) || [];

  const next = useCallback(() => {
    if (activeAds.length === 0) return;
    setCurrent((prev) => (prev + 1) % activeAds.length);
  }, [activeAds.length]);

  const prev = useCallback(() => {
    if (activeAds.length === 0) return;
    setCurrent((p) => (p - 1 + activeAds.length) % activeAds.length);
  }, [activeAds.length]);

  // Auto-rotate every 5 seconds
  useEffect(() => {
    if (activeAds.length <= 1) return;
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next, activeAds.length]);

  // Track impression when ad changes
  const currentAdId = activeAds[current]?.id;
  useEffect(() => {
    if (currentAdId) {
      trackImpression(currentAdId);
    }
  }, [currentAdId]);

  if (activeAds.length === 0) return null;

  const ad = activeAds[current];

  return (
    <div className="relative w-full rounded-2xl overflow-hidden border border-border bg-card">
      <div className="relative h-40 md:h-52">
        {ad.image_url ? (
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-r from-primary/10 to-primary/5 flex items-center justify-center">
            <span className="text-muted-foreground">Ad</span>
          </div>
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
        <Badge className="absolute top-3 right-3 bg-amber-500/90 text-white border-0 text-xs">
          Sponsored
        </Badge>
        <div className="absolute bottom-0 left-0 right-0 p-4">
          <h3 className="text-white font-semibold text-lg">{ad.title}</h3>
          {ad.description && (
            <p className="text-white/80 text-sm mt-1 line-clamp-2">
              {ad.description}
            </p>
          )}
        </div>
      </div>

      {activeAds.length > 1 && (
        <>
          <button
            type="button"
            onClick={prev}
            className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={next}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/40 text-white hover:bg-black/60 transition-colors"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {activeAds.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-colors ${
                  i === current ? "bg-white" : "bg-white/40"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default AdsCarousel;
