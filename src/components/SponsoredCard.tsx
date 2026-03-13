import { Badge } from "@/components/ui/badge";
import { Megaphone } from "lucide-react";
import type { ActiveAd } from "@/hooks/useActiveAds";

interface SponsoredCardProps {
  ad: ActiveAd;
}

const SponsoredCard = ({ ad }: SponsoredCardProps) => {
  return (
    <div className="group bg-card rounded-2xl overflow-hidden shadow-lg border-2 border-dashed border-primary/30 hover:border-primary/50 transition-all duration-300">
      {ad.image_url && (
        <div className="relative h-48 overflow-hidden">
          <img
            src={ad.image_url}
            alt={ad.title}
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            loading="lazy"
          />
          <Badge className="absolute top-3 right-3 bg-amber-500 text-white border-0 gap-1">
            <Megaphone className="w-3 h-3" />
            Sponsored
          </Badge>
        </div>
      )}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-bold text-lg text-foreground group-hover:text-primary transition-colors">
            {ad.title}
          </h3>
          {!ad.image_url && (
            <Badge className="bg-amber-500 text-white border-0 gap-1 flex-shrink-0">
              <Megaphone className="w-3 h-3" />
              Sponsored
            </Badge>
          )}
        </div>
        {ad.description && (
          <p className="text-muted-foreground text-sm mt-2 line-clamp-2">{ad.description}</p>
        )}
        {ad.target_location && (
          <p className="text-xs text-muted-foreground mt-2">{ad.target_location}</p>
        )}
      </div>
    </div>
  );
};

export default SponsoredCard;
