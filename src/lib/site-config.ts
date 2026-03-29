/**
 * Configuración centralizada de marca — LA UNIÓN MUDANZAS
 * Todos los componentes deben consumir estos valores.
 * NO hardcodear datos de contacto, folios ni branding en otros archivos.
 */
export const siteConfig = {
  brandName: "La Unión Mudanzas",
  brandShort: "LUM",
  slogan: "Cada mudanza es una historia",
  sloganSecondary: "Salimos todas las semanas · Servicio compartido disponible",
  hashtag: "#LaUnionMudanzas",

  // Contacto
  whatsApp: "4421270514",
  whatsAppFull: "524421270514",
  phone: "4421270514",
  email: "admin@launionmudanzas.com",
  domain: "launionmudanzas.com",

  // Folios
  folioPrefix: "LUM",

  // Links legales
  termsUrl: "/terminos-y-condiciones",
  privacyUrl: "/aviso-de-privacidad",

  // Social
  socialTag: "🚛 LA UNIÓN MUDANZAS",
} as const;
