# Validation — 24 September 2026

- Astro production build: 67 static HTML pages, including the friendly 404.
- Curriculum audit: nine courses, 37 units, 20 credits and 500 marks; external/internal/SIP columns total 270/180/50.
- Link audit: all generated local href/src targets exist; exactly one h1 per HTML page.
- Browser: Edge, 35 responsive checks across 360, 390, 412, 768 and 1440 pixels, covering home, semester, unit, materials, internship, quiz and infographic pages. No horizontal overflow.
- Browser interactions: mobile navigation; persistent unit progress; aggregate progress; bookmark save/remove; saved list; topic search; search empty state; filter empty state/reset; quiz score/retry; persistent dark theme; clear local data; practical checklist; original PDF download; 404 response. All passed with no browser JavaScript errors.
- Visual inspection: desktop and mobile home, dark quiz, mobile marks infographic. Enlarged root text check on the infographic: no horizontal overflow.
- Draft exclusion: ELPS review pack and example notice omitted from production routes and public search data.
- Dependencies: Astro 7.3.4; npm audit reports zero vulnerabilities at verification time.
- Optional WebMCP progress tool is feature-detected. This browser does not expose document.modelContext, so actual WebMCP registration/execution validation was unavailable. The same visible progress action was browser-tested.

This validates the implementation, not a human academic review of generated subject notes. No human review is claimed. The original document's naming and internship inconsistencies are recorded in SOURCE-AUDIT.md and visible on the site.
