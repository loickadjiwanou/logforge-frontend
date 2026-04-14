export const DEFAULT_PRIMARY = '#10b981'; // emerald-500 by default

export const getPrimaryColor = () => {
  return localStorage.getItem('logforge_primary_color') || DEFAULT_PRIMARY;
};

export const setPrimaryColor = (hexColor) => {
  localStorage.setItem('logforge_primary_color', hexColor);
  applyPrimaryColor(hexColor);
};

// Helper: Convert hex to HSL string: "H S% L%"
const hexToHSL = (hex) => {
  let r = 0, g = 0, b = 0;
  if (hex.length === 4) {
    r = "0x" + hex[1] + hex[1];
    g = "0x" + hex[2] + hex[2];
    b = "0x" + hex[3] + hex[3];
  } else if (hex.length === 7) {
    r = "0x" + hex[1] + hex[2];
    g = "0x" + hex[3] + hex[4];
    b = "0x" + hex[5] + hex[6];
  }
  r /= 255; g /= 255; b /= 255;
  let cmin = Math.min(r, g, b), cmax = Math.max(r, g, b), delta = cmax - cmin, h = 0, s = 0, l = 0;
  if (delta === 0) h = 0;
  else if (cmax === r) h = ((g - b) / delta) % 6;
  else if (cmax === g) h = (b - r) / delta + 2;
  else h = (r - g) / delta + 4;
  h = Math.round(h * 60);
  if (h < 0) h += 360;
  l = (cmax + cmin) / 2;
  s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
  s = +(s * 100).toFixed(1);
  l = +(l * 100).toFixed(1);
  return `${h} ${s}% ${l}%`;
};

export const applyPrimaryColor = (color = getPrimaryColor()) => {
  const root = document.documentElement;
  const hsl = hexToHSL(color);

  // Set CSS variables that will be picked up by our CSS overrides
  root.style.setProperty('--app-primary', hsl);
  root.style.setProperty('--app-primary-hex', color);
};

/**
 * Load global app settings from the server and apply color + logo.
 * Called once on app startup after authentication.
 * @param {object} api - The axios api instance
 * @returns {object} app settings object { app_name, primary_color, logo_url }
 */
export const loadAppSettings = async (api) => {
  try {
    const res = await api.get('/settings/app');
    const settings = res.data;

    // Apply primary color from server (server is source of truth)
    if (settings.primary_color) {
      localStorage.setItem('logforge_primary_color', settings.primary_color);
      applyPrimaryColor(settings.primary_color);
    }

    return settings;
  } catch (e) {
    // Fall back to local color if server unavailable
    applyPrimaryColor(getPrimaryColor());
    return { app_name: 'LogForge', primary_color: getPrimaryColor(), logo_url: null };
  }
};
