import type { SiteLogoVariant } from "@xblog/contracts";

type SiteLogoProps = {
  variant: SiteLogoVariant;
  className?: string;
};

function classes(...values: Array<string | undefined | false>) {
  return values.filter(Boolean).join(" ");
}

function AuroraPulseLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={classes("site-logo-svg", className)}
      viewBox="0 0 300 92"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-pulse-orb" x1="18" y1="14" x2="62" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#BBFFF7" />
          <stop offset="0.34" stopColor="#7DE7FF" />
          <stop offset="0.7" stopColor="#C79AFF" />
          <stop offset="1" stopColor="#FF81D2" />
        </linearGradient>
        <linearGradient id="logo-pulse-word" x1="64" y1="14" x2="198" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#F8FCFF" />
          <stop offset="0.58" stopColor="#D6E7FF" />
          <stop offset="1" stopColor="#D8D5FF" />
        </linearGradient>
        <linearGradient id="logo-pulse-wave" x1="104" y1="42" x2="258" y2="44" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8EFFF0" stopOpacity="0.26" />
          <stop offset="0.46" stopColor="#89EBFF" stopOpacity="0.82" />
          <stop offset="1" stopColor="#C69BFF" stopOpacity="0.18" />
        </linearGradient>
      </defs>
      <circle cx="28" cy="31" r="17" fill="url(#logo-pulse-orb)" />
      <circle cx="21" cy="24" r="4.3" fill="white" fillOpacity="0.96" />
      <path
        d="M44 23C49 27 52 32 52 39C52 49 44 57 33 57C26 57 21 55 17 50"
        stroke="white"
        strokeOpacity="0.46"
        strokeLinecap="round"
        strokeWidth="2.3"
      />
      <text
        fill="url(#logo-pulse-word)"
        fontFamily="Oxanium, Bahnschrift, Segoe UI, Arial, sans-serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="-0.06em"
        x="52"
        y="43"
      >
        XBlog
      </text>
      <path
        d="M102 44C128 36 151 37 175 43C194 48 215 50 258 43"
        stroke="url(#logo-pulse-wave)"
        strokeLinecap="round"
        strokeWidth="5"
      />
    </svg>
  );
}

function PrototypeMinimalGlowLogo({ className }: { className?: string }) {
  return (
    <span aria-hidden="true" className={classes("site-logo-concept-a", className)}>
      <span className="site-logo-concept-a-glow" />
      <span className="site-logo-concept-a-word">XBlog</span>
    </span>
  );
}

function AuroraEditorialLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={classes("site-logo-svg", className)}
      viewBox="0 0 300 92"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-editorial-orb" x1="30" y1="16" x2="66" y2="56" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B9FFF7" />
          <stop offset="0.34" stopColor="#7DE7FF" />
          <stop offset="0.68" stopColor="#C795FF" />
          <stop offset="1" stopColor="#FF79CE" />
        </linearGradient>
        <linearGradient id="logo-editorial-word" x1="74" y1="18" x2="184" y2="46" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDFEFF" />
          <stop offset="0.54" stopColor="#DBECFF" />
          <stop offset="1" stopColor="#DAD4FF" />
        </linearGradient>
        <linearGradient id="logo-editorial-line" x1="84" y1="58" x2="224" y2="58" gradientUnits="userSpaceOnUse">
          <stop stopColor="#8BFFF0" />
          <stop offset="0.55" stopColor="#78E7FF" />
          <stop offset="1" stopColor="#C291FF" />
        </linearGradient>
      </defs>
      <circle cx="38" cy="32" r="18" fill="url(#logo-editorial-orb)" fillOpacity="0.92" />
      <circle cx="30" cy="25" r="4.6" fill="white" fillOpacity="0.96" />
      <path
        d="M53 24C58 28 61 33 61 40C61 51 52 60 40 60C33 60 27 57 23 52"
        stroke="white"
        strokeOpacity="0.46"
        strokeLinecap="round"
        strokeWidth="2.4"
      />
      <text
        fill="url(#logo-editorial-word)"
        fontFamily="Oxanium, Bahnschrift, Segoe UI, Arial, sans-serif"
        fontSize="34"
        fontWeight="700"
        letterSpacing="-0.05em"
        x="54"
        y="43"
      >
        XBlog
      </text>
      <path
        d="M86 54C112 44 134 44 154 50C173 56 192 58 222 52"
        stroke="url(#logo-editorial-line)"
        strokeOpacity="0.72"
        strokeLinecap="round"
        strokeWidth="4.4"
      />
    </svg>
  );
}

function AuroraScriptLockupLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={classes("site-logo-svg", className)}
      viewBox="0 0 300 92"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-script-orb" x1="26" y1="14" x2="66" y2="60" gradientUnits="userSpaceOnUse">
          <stop stopColor="#C1FFF7" />
          <stop offset="0.32" stopColor="#7BEAFF" />
          <stop offset="0.7" stopColor="#C39BFF" />
          <stop offset="1" stopColor="#FF86D4" />
        </linearGradient>
        <linearGradient id="logo-script-word" x1="72" y1="16" x2="202" y2="54" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDFEFF" />
          <stop offset="0.38" stopColor="#DDF8FF" />
          <stop offset="0.75" stopColor="#DDD6FF" />
          <stop offset="1" stopColor="#FFC7EE" />
        </linearGradient>
        <linearGradient id="logo-script-veil" x1="92" y1="50" x2="254" y2="42" gradientUnits="userSpaceOnUse">
          <stop stopColor="#94FFF1" stopOpacity="0.18" />
          <stop offset="0.42" stopColor="#8DEBFF" stopOpacity="0.78" />
          <stop offset="1" stopColor="#FF93D9" stopOpacity="0.2" />
        </linearGradient>
      </defs>
      <circle cx="38" cy="32" r="18" fill="url(#logo-script-orb)" fillOpacity="0.9" />
      <circle cx="30" cy="24" r="4.5" fill="white" fillOpacity="0.96" />
      <path
        d="M54 24C59 28 62 33 62 40C62 51 53 60 41 60C34 60 28 57 24 52"
        stroke="white"
        strokeOpacity="0.46"
        strokeLinecap="round"
        strokeWidth="2.3"
      />
      <path
        d="M94 49C122 38 146 38 168 45C191 52 213 54 252 44"
        stroke="url(#logo-script-veil)"
        strokeLinecap="round"
        strokeWidth="5.2"
      />
      <text
        fill="url(#logo-script-word)"
        fontFamily="Gabriola, Segoe Script, cursive"
        fontSize="40"
        fontWeight="400"
        x="60"
        y="48"
      >
        XBlog
      </text>
    </svg>
  );
}

function AuroraPillBrandLogo({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={classes("site-logo-svg", className)}
      viewBox="0 0 300 92"
      xmlns="http://www.w3.org/2000/svg"
    >
      <defs>
        <linearGradient id="logo-pill-orb" x1="38" y1="22" x2="78" y2="66" gradientUnits="userSpaceOnUse">
          <stop stopColor="#B9FFF7" />
          <stop offset="0.34" stopColor="#7DE7FF" />
          <stop offset="0.7" stopColor="#C89BFF" />
          <stop offset="1" stopColor="#FF86D4" />
        </linearGradient>
        <linearGradient id="logo-pill-word" x1="88" y1="24" x2="212" y2="48" gradientUnits="userSpaceOnUse">
          <stop stopColor="#FDFEFF" />
          <stop offset="0.55" stopColor="#DEECFF" />
          <stop offset="1" stopColor="#DDD5FF" />
        </linearGradient>
        <linearGradient id="logo-pill-strip" x1="138" y1="18" x2="244" y2="24" gradientUnits="userSpaceOnUse">
          <stop stopColor="#96FFF2" stopOpacity="0" />
          <stop offset="0.46" stopColor="#8DEBFF" stopOpacity="0.82" />
          <stop offset="1" stopColor="#C99EFF" stopOpacity="0" />
        </linearGradient>
      </defs>
      <rect
        fill="#FFFFFF"
        fillOpacity="0.035"
        height="58"
        rx="29"
        stroke="#FFFFFF"
        strokeOpacity="0.08"
        width="260"
        x="20"
        y="16"
      />
      <path
        d="M140 22C164 14 190 14 214 20C232 24 246 25 260 20"
        stroke="url(#logo-pill-strip)"
        strokeLinecap="round"
        strokeWidth="4.2"
      />
      <circle cx="52" cy="45" r="18" fill="url(#logo-pill-orb)" />
      <circle cx="44" cy="37" r="4.6" fill="white" fillOpacity="0.96" />
      <path
        d="M67 37C72 41 75 46 75 53C75 64 66 73 54 73C47 73 41 70 37 65"
        stroke="white"
        strokeOpacity="0.46"
        strokeLinecap="round"
        strokeWidth="2.3"
      />
      <text
        fill="url(#logo-pill-word)"
        fontFamily="Oxanium, Bahnschrift, Segoe UI, Arial, sans-serif"
        fontSize="31"
        fontWeight="700"
        letterSpacing="-0.05em"
        x="80"
        y="49"
      >
        XBlog
      </text>
    </svg>
  );
}

export function SiteLogo({ variant, className }: SiteLogoProps) {
  if (variant === "prototype") {
    return (
      <span aria-hidden="true" className={classes("site-logo", "site-logo--prototype", className)}>
        <span className="site-logo-prototype-mark" />
        <span className="site-logo-prototype-word">XBlog</span>
      </span>
    );
  }

  if (variant === "prototype-minimal-glow") {
    return (
      <span aria-hidden="true" className={classes("site-logo", "site-logo--prototype-minimal-glow", className)}>
        <PrototypeMinimalGlowLogo />
      </span>
    );
  }

  if (variant === "aurora-pulse") {
    return (
      <span aria-hidden="true" className={classes("site-logo", "site-logo--aurora-pulse", className)}>
        <AuroraPulseLogo />
      </span>
    );
  }

  if (variant === "aurora-editorial") {
    return (
      <span aria-hidden="true" className={classes("site-logo", "site-logo--aurora-editorial", className)}>
        <AuroraEditorialLogo />
      </span>
    );
  }

  if (variant === "aurora-script-lockup") {
    return (
      <span aria-hidden="true" className={classes("site-logo", "site-logo--aurora-script-lockup", className)}>
        <AuroraScriptLockupLogo />
      </span>
    );
  }

  return (
    <span aria-hidden="true" className={classes("site-logo", "site-logo--aurora-pill-brand", className)}>
      <AuroraPillBrandLogo />
    </span>
  );
}
