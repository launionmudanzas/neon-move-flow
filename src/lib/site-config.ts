/**
 * Configuración centralizada de marca — LA UNIÓN MUDANZAS
 * Todos los componentes deben consumir estos valores.
 * NO hardcodear datos de contacto, folios ni branding en otros archivos.
 */
export const siteConfig = {
  brandName: "LA UNIÓN MUDANZAS",
  brandShort: "LUM",
  slogan: "Cada mudanza es una historia",
  sloganSecondary: "Salimos todas las semanas · Servicio compartido disponible",
  hashtag: "#LaUnionMudanzas",

  // Contacto
  whatsApp: "4151773626",
  whatsAppFull: "524151773626",
  whatsAppDisplay: "415 177 3626",
  phone: "5549102634",
  phoneDisplay: "554 910 2634",
  email: "launionmudanzas@gmail.com",
  domain: "https://launionmudanzas.com",

  // Folios
  folioPrefix: "LUM",

  // Links legales
  termsUrl: "/terminos-y-condiciones",
  privacyUrl: "/aviso-de-privacidad",

  // Social
  socialTag: "🚛 LA UNIÓN MUDANZAS",
} as const;
