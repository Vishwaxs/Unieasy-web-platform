import { Link } from "react-router-dom";

import lightLogoHref from "@/assets/Light_Logo.png";
import darkLogoHref from "@/assets/Dark_Logo.png";
import { useTheme } from "@/hooks/useTheme";

const Logo = () => {
  const { theme } = useTheme();

  return (
    <Link to="/" className="flex items-center gap-2 group" aria-label="UniEasy">
      <img
        src={theme === "dark" ? darkLogoHref : lightLogoHref}
        alt="UniEasy"
        className="h-8 md:h-9 w-auto drop-shadow-sm group-hover:drop-shadow transition-all duration-300"
        loading="eager"
        decoding="async"
      />
    </Link>
  );
};

export default Logo;
