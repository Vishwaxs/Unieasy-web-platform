import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";

import lightLogoHref from "@/assets/light.png";
import darkLogoHref from "@/assets/dark.png";
import { useTheme } from "@/hooks/useTheme";

type LogoProps = {
  className?: string;
  imgClassName?: string;
};

const Logo = ({ className, imgClassName }: LogoProps) => {
  const { theme } = useTheme();

  return (
    <Link to="/" className={cn("flex items-center gap-2 group", className)} aria-label="UniEasy">
      <img
        src={theme === "dark" ? darkLogoHref : lightLogoHref}
        alt="UniEasy"
        className={cn(
          "h-14 md:h-16 w-auto drop-shadow-sm group-hover:drop-shadow transition-all duration-300",
          imgClassName
        )}
        loading="eager"
        decoding="async"
      />
    </Link>
  );
};

export default Logo;
