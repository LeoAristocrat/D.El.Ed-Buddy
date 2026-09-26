# ID Card Generator

Route: `/tools/id-card/`, linked through Tools in the main navigation.

- `src/data/id-card.ts`: institute presets, editable field types, template labels, colors, text bounds and physical dimensions.
- `src/components/id-card/`: form, photo controls, SVG template and separate blank signature areas.
- `src/scripts/id-card.ts`: live text fitting, validation, in-memory photo preparation/cropping, print preview and PNG export.
- `src/styles/id-card.css`: responsive generator UI and card-only print styles.

Add institute presets to `institutes` to reuse the existing template. Names remain editable, and Other institute allows custom details. New layouts belong in the template configuration and SVG component, not in an institute-specific form.

The card uses a landscape 85.6 × 54 mm format. Print on A4 at 100% with browser headers and footers off. Save as PDF uses the browser print dialog; SVG text remains vector. PNG is 2568 × 1620 pixels; use PDF/print for dependable physical sizing. Printer settings can override scaling.

Photo decoding/cropping happens in the tab. Only the normalized photo is rasterized; the live and printed card remain SVG. No student data is sent, logged or placed in storage or URLs. Downloads are explicitly saved by the user. Signature areas contain labels and empty ruled spaces only.

No new runtime dependencies. Browser checks use the environment's existing Playwright installation and synthetic student/photo data. No reference student's personal data or photo is bundled with the site.
