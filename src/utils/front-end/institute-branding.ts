type InstituteBrandingSource = {
  largeLogo?: string | null;
  smallLogoEn?: string | null;
  smallLogoFr?: string | null;
  primaryColor?: string | null;
  primaryColorDark?: string | null;
  secondaryColor?: string | null;
  secondaryColorDark?: string | null;
  accentColor?: string | null;
} | null | undefined;

export const DEFAULT_SMALL_LOGO = "/favicon.png";
export const DEFAULT_LARGE_LOGO = "/life-home2.png";

export const DEFAULT_BRAND_COLORS = {
  primaryColor: "#6DE195",
  primaryColorDark: "#41C7AF",
  secondaryColor: "#41D8DD",
  secondaryColorDark: "#5583EE",
  accentColor: "#C4E759",
} as const;

const HEX_COLOR_REGEX = /^#[0-9A-F]{6}$/i;

function normalizeHexColor(value: string | null | undefined, fallback: string) {
  if (!value) return fallback;
  const trimmed = value.trim().toUpperCase();
  return HEX_COLOR_REGEX.test(trimmed) ? trimmed : fallback;
}

function normalizeImageSource(
  value: string | null | undefined,
  fallback: string
) {
  if (!value) return fallback;
  const trimmed = value.trim();
  return trimmed || fallback;
}

export function getInstituteBrandColors(institute: InstituteBrandingSource) {
  return {
    primaryColor: normalizeHexColor(
      institute?.primaryColor,
      DEFAULT_BRAND_COLORS.primaryColor
    ),
    primaryColorDark: normalizeHexColor(
      institute?.primaryColorDark,
      DEFAULT_BRAND_COLORS.primaryColorDark
    ),
    secondaryColor: normalizeHexColor(
      institute?.secondaryColor,
      DEFAULT_BRAND_COLORS.secondaryColor
    ),
    secondaryColorDark: normalizeHexColor(
      institute?.secondaryColorDark,
      DEFAULT_BRAND_COLORS.secondaryColorDark
    ),
    accentColor: normalizeHexColor(
      institute?.accentColor,
      DEFAULT_BRAND_COLORS.accentColor
    ),
  };
}

export function getInstituteCssVariables(institute: InstituteBrandingSource) {
  const colors = getInstituteBrandColors(institute);
  return {
    "--brand-primary": colors.primaryColor,
    "--brand-primary-dark": colors.primaryColorDark,
    "--brand-secondary": colors.secondaryColor,
    "--brand-secondary-dark": colors.secondaryColorDark,
    "--brand-accent": colors.accentColor,
  } as const;
}

export function getInstituteSmallLogo(
  institute: InstituteBrandingSource,
  en: boolean
) {
  if (en) {
    return normalizeImageSource(
      institute?.smallLogoEn || institute?.smallLogoFr,
      DEFAULT_SMALL_LOGO
    );
  }

  return normalizeImageSource(
    institute?.smallLogoFr || institute?.smallLogoEn,
    DEFAULT_SMALL_LOGO
  );
}

export function getInstituteLargeLogo(institute: InstituteBrandingSource) {
  return normalizeImageSource(institute?.largeLogo, DEFAULT_LARGE_LOGO);
}

/**
 * Returns the French name if available and language is French,
 * otherwise falls back to the English name.
 */
export function getLocalizedInstituteName(
  institute: { name: string; name_fr?: string | null } | null | undefined,
  en: boolean
): string {
  if (!institute) return "";
  if (!en && institute.name_fr) return institute.name_fr;
  return institute.name;
}
