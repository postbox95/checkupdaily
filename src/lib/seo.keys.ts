/** Client-safe key helper shared by the SEO bundle and admin UI. */
export const seoKey = (entityType: string, entityKey: string, lang: string) =>
  `${entityType}:${entityKey}:${lang}`;
