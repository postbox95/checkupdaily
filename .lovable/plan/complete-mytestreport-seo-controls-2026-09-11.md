# Complete MyTestReport SEO controls

## Admin controls
- Split the existing Settings area into separate **Site settings** and **SEO settings** tabs.
- Add a global SEO editor for site identity, defaults, indexing, social sharing, organization details, and language settings.
- Add entity-level SEO editors for pages, tests, chains, branches, and categories, including slug, canonical URL, keywords, editorial content, sitemap controls, and reusable FAQs.
- Add a Google-style preview, field-length health checks, and a 301/302 redirect manager.

## Public-page SEO
- Load saved SEO settings on the homepage, comparison page, and chain pages.
- Generate canonical URLs, robots rules, Open Graph/Twitter metadata, and relevant Organization, WebSite, Breadcrumb, FAQ, and local-business structured data.
- Keep cart/comparison, authentication, admin, legacy, and error pages excluded from indexing.
- Preserve automatic test/category fallbacks when no admin override exists.

## Verification
- Validate the admin save/delete flows, route metadata, sitemap and robots output.
- Check the current build status and key desktop/mobile pages for visible regressions.

## Technical details
- Reuse the existing SEO tables and authenticated server functions; no new database schema is required.
- Add the SEO editor as a focused admin component and use existing React Query hooks and design-system controls.
- Use the public project origin `https://med-compare-bd.lovable.app` for self-referencing canonical and Open Graph URLs.
