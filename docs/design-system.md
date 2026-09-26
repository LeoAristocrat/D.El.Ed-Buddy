# D.El.Ed Buddy · Study desk design system

## Audit
Astro static routes, Markdown resources and shared components already supply the product's functionality. The previous CSS grew through layered overrides: small typography, identical panels, inconsistent icon glyphs, dense navigation and uneven form/reader layouts. Search, filters, local bookmarks/progress, six themes, Formspree forms and the SVG ID generator must remain intact. Uploaded HTML/PDF/image content and the institutional card are independent documents, not redesign targets.

## Direction
Warm editorial study desk: ivory paper, forest teal, measured amber details, deliberate typography and hairline divisions. Manrope and DM Sans remain; a native serif italic supplies the editorial accent. No additional font or animation packages. All six themes retain their identity with explicit surface and contrast tokens.

## Structure
`tokens.css` defines color, type, spacing, radii, shadows and motion. `global.css` composes the system through `foundation.css`, `home.css`, `components.css`, `panels.css` and `responsive.css`. `motion.css` and `motion.ts` provide progressive, optional transitions. `Icon.astro` is the stroke icon family; `StudyFolio.astro` is the CSS-built hero notebook. Existing PageHeader, CourseCard, ResourceCard and StudyFormats remain the reusable foundations.

## Interaction rules
Natural scroll; 160–240 ms interaction feedback; one-time 560 ms section reveals; short native cross-document view transitions where supported. Pointer depth is restricted to the hero and fine pointers. No custom cursor, continuous animation loop, scroll hijacking or required entrance animation. Reduced motion disables movement. Content is visible if JavaScript fails. Reading content stays restrained.

## Scope and safeguards
Keep all route paths, content files, downloads, Formspree endpoints and storage keys. No deployment. No personal ID data is collected. Print CSS for the ID card remains isolated from the app shell. The card's vector template, dimensions and empty signature areas are unchanged.

## Files changed
- Added: the token/style modules above, `scripts/motion.ts`, `components/Icon.astro`, `components/StudyFolio.astro`, and this guide.
- Reworked: `layouts/Layout.astro`, `pages/index.astro`, `components/PageHeader.astro`, `CourseCard.astro`, `ResourceCard.astro`, `StudyFormats.astro`, and `styles/global.css`.
- Small interaction changes: `scripts/client.ts` (mobile menu, search loading, progress styling), `pages/contribute.astro` (success/error styling), and `pages/404.astro`.
- Unchanged: resource files, institute card template, ID generator logic, delivery endpoints, route paths and local storage keys.

## Validation
- `npm.cmd run build`: 137 static pages.
- `node tmp/test-redesign.mjs` (run from workspace root): 17 major routes at 1440, 768, 390 and 320 px; no horizontal page overflow. Keyboard menu/Escape, all six themes, primary/secondary text and button contrast, filters/reset/empty state, resource downloads, notes iframe, bookmarks, unit progress, search, reduced motion and uncaught browser errors checked.
- Contribution and issue report success/rate-limit states tested using intercepted Formspree responses. No real submissions sent.
- `node tmp/test-id-card.mjs`: live edits, optional fields, validation, synthetic photo crop/removal, PNG download, print preview, A4 PDF with a single 85.6 × 54 mm card, and empty physical signature spaces passed.
- Visual inspection: desktop/mobile home, dark home, materials, subject, about and ID generator.
- No existing type-check or lint script/compiler is configured. Astro production compilation and browser checks were used; this is not a claim of a separate TypeScript/lint pass.

## Known limits
Cross-document transitions depend on browser support and fall back to regular navigation. Google Fonts and the supplied embedded notes' existing CDN requirements remain. Loading errors inside sandboxed HTML frames cannot be reliably inspected, so the full-screen/PDF alternatives remain available. Browser PDF output and printer scaling settings are user-controlled. No animation, WebGL, UI framework or other dependency was added.
