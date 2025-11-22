/**
 * Zentrale Sammlung aller Social Media Links und URLs
 * Central collection of all social media links and URLs
 */

// Company Social Media Profiles
export const companySocial = {
  linkedin: "https://linkedin.com/company/memoro-app",
  twitter: "https://twitter.com/memoroapp",
  instagram: "https://instagram.com/memoroapp",
  youtube: "https://youtube.com/@memoroapp",
  github: "https://github.com/memoro-app",
  facebook: "https://facebook.com/memoroapp",
};

// Team Member Social Links
export const teamSocial = {
  tillSchneider: {
    linkedin: "https://www.linkedin.com/in/tillschneider/",
  },
  nilsWeiser: {
    linkedin: "https://www.linkedin.com/in/nils-w-42b6a5213/",
    github: "https://github.com/nilsweiser",
  },
  dirkZimanky: {
    linkedin: "https://www.linkedin.com/in/dirk-zimanky-0972a4139/",
    github: "https://github.com/dirkzimanky",
  },
  florianKoenig: {
    linkedin: "https://linkedin.com/in/florian-koenig",
    github: "https://github.com/floriankoenig",
  },
  lucasMag: {
    linkedin: "https://www.linkedin.com/in/lucas-mag-b79993220/",
    github: "https://github.com/lucasmag",
  },
  tobiasMueller: {
    linkedin: "https://www.linkedin.com/in/tobias-m%C3%BCller-2418b2145/",
    github: "https://github.com/tobiasmueller",
  },
  claraKontext: {
    linkedin: "https://linkedin.com/in/clara-kontext",
    twitter: "https://twitter.com/clarakontext",
  },
  katharinaRichter: {
    linkedin: "https://linkedin.com/in/katharina-richter",
  },
  davidBuchner: {
    linkedin: "https://linkedin.com/in/david-buchner",
    github: "https://github.com/davidbuchner",
  },
  ninaSorgfalt: {
    linkedin: "https://linkedin.com/in/nina-sorgfalt",
  },
  rolandStutz: {
    linkedin: "https://linkedin.com/in/roland-stutz",
  },
  irisLibera: {
    linkedin: "https://linkedin.com/in/iris-libera",
  },
  felixWolkenstein: {
    linkedin: "https://linkedin.com/in/felix-wolkenstein",
    github: "https://github.com/felixwolkenstein",
  },
  emmaLichtblick: {
    linkedin: "https://linkedin.com/in/emma-lichtblick",
  },
  victoriaBrueckner: {
    linkedin: "https://linkedin.com/in/victoria-brueckner",
  },
  oliverWolkenstein: {
    linkedin: "https://linkedin.com/in/oliver-wolkenstein",
  },
  melissaSchreiber: {
    linkedin: "https://linkedin.com/in/melissa-schreiber",
  },
};

// External Links & Resources
export const externalLinks = {
  // App Downloads
  appStore: "https://apps.apple.com/app/memoro",
  playStore: "https://play.google.com/store/apps/details?id=com.memoro.app",
  
  // Documentation & Support
  documentation: "https://docs.memoro.app",
  support: "https://support.memoro.app",
  status: "https://status.memoro.app",
  
  // Press & Media
  pressKit: "https://memoro.app/presskit",
  blog: "https://memoro.app/blog",
  
  // Legal
  privacy: "https://memoro.app/privacy",
  terms: "https://memoro.app/terms",
  imprint: "https://memoro.app/imprint",
  
  // Partner Links
  codifyAG: "https://codify.ag",
  
  // Analytics & Tools
  plausible: "https://plausible.io",
  umami: "https://umami.is",
};

// Email Addresses
export const emailAddresses = {
  general: "info@memoro.app",
  support: "support@memoro.app",
  press: "press@memoro.app",
  legal: "legal@memoro.app",
  privacy: "privacy@memoro.app",
  sales: "sales@memoro.app",
  careers: "careers@memoro.app",
};

// Company Information
export const companyInfo = {
  name: "Memoro GmbH",
  address: {
    street: "Beispielstraße 123",
    city: "Berlin",
    postalCode: "10115",
    country: "Deutschland",
  },
  phone: "+49 (0) 30 123456789",
  fax: "+49 (0) 30 123456780",
  vatId: "DE123456789",
  tradingRegister: "HRB 123456 B",
  registryCourt: "Amtsgericht Berlin-Charlottenburg",
};

// API Endpoints (for internal use)
export const apiEndpoints = {
  production: "https://api.memoro.app",
  staging: "https://staging-api.memoro.app",
  development: "http://localhost:3000",
};

// CDN & Asset URLs
export const assetUrls = {
  images: "https://cdn.memoro.app/images",
  videos: "https://cdn.memoro.app/videos",
  downloads: "https://cdn.memoro.app/downloads",
};

// Video Resources
export const videoResources = {
  tutorials: {
    grundlagenDeutsch: "https://youtu.be/u05nEBNy7bk", // Memoro Grundlagen Tutorial (Deutsch)
  },
};

// Helper function to get all social links for a team member
export function getTeamMemberSocial(memberKey: keyof typeof teamSocial) {
  return teamSocial[memberKey] || {};
}

// Helper function to get company social link by platform
export function getCompanySocial(platform: keyof typeof companySocial) {
  return companySocial[platform];
}

// Export all configurations as default
export default {
  companySocial,
  teamSocial,
  externalLinks,
  emailAddresses,
  companyInfo,
  apiEndpoints,
  assetUrls,
  videoResources,
};