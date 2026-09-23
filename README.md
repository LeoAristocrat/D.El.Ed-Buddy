# D.El.Ed Buddy

A static Astro site for Sayeem Sadik / Leo Aristocrat. Semester 1 first; Semesters 2–4 intentionally show Coming later. No accounts, database, ads or paid features.

## Run locally

Node 22.12+ (Node 24 recommended).

```sh
npm ci
npm run dev
npm run build
```

Open the local address printed by Astro. Production output is in `dist/`. `.openai/hosting.json` contains the private Sites identity. The source document in `public/curriculum-2024.pdf` is the user-supplied copy, not a claim to the latest curriculum.

## Add a resource in a few minutes

```sh
npm run new-resource -- growth-and-development s1-1 1 "Notes"
```

1. Open the generated Markdown file under `content/resources/`.
2. Add your title, description, notes, source, author and update date.
3. Choose the correct resource type, course, unit and syllabus version.
4. Review facts and wording. Change `status` from `draft` to `review`, then `published` when ready.
5. Run `npm run build` and deploy the new static output.

The resource automatically appears on its course/unit page, in material filters, search, recently added and What's new. No page redesign is needed. Use stable filenames: bookmarks point to the generated resource URL. Put downloadable files under `public/downloads/` and set `pdf: "/downloads/your-file.pdf"`. A filename can include subdirectories, e.g. `content/resources/s1-1/growth.md` becomes `/materials/s1-1/growth/`.

Supported types: Notes, Short Notes, Revision, Infographics, PDFs, Important Questions, MCQs, Quizzes and Reference. Statuses: draft, review, published, archived. **Only published items enter routes and search.** Generated material uses `origin: "AI-assisted"`; publication fails unless `reviewedBy` names a human who actually reviewed it. Never fabricate a reviewer or label AI drafts as Leo's own notes.

`content/resources/s1-6/elps-review-pack.md` is a source-grounded review example covering an explanation, revision, practice questions, an MCQ and an infographic outline. It is deliberately unpublished. More subject explanations require supporting source material and human review.

## Content structure

- `src/data/courses.json`: 9 courses, 37 official units/topics, assessment columns, page references, practicum, SIP and references. Keep source discrepancies visible.
- `src/content.config.ts`: validated Markdown resource and notice collections.
- `content/resources/`: independent educational content, portable to a future Android app or CMS.
- `content/notices/`: notice schema example in draft status. Replace with verified details before publishing.
- `src/data/quiz.json`: orientation questions, four options, zero-based answer, explanation, revision topic and source PDF page.
- `src/components/`: reusable course/resource cards, page headings, study-format links.
- `src/pages/courses/`: data-driven course/unit routes and future-semester availability pages.
- `src/pages/search-index.json.ts`: generated public search data; drafts never enter it.
- `src/data/site.ts`: creator links, official resources and deployed origin.
- `src/scripts/client.ts`: local bookmarks, progress, checklists, filters, search, theme and quiz behavior.

Course records and resources carry `syllabusVersion`. Preserve a new version as a separate dataset and route namespace rather than overwriting 2024 records. Add future semesters to the model and route generation only after importing their verified curriculum; do not activate empty invented courses. No later-semester study content is currently active.

## Notices

Each notice has title, date, category, summary, source, exact originalUrl, optional attachment and status. Notices appear separately from study resources. This first version has no published notices. A lack of notices here is not a statement that SCERT has no announcements.

## Identity and links

Replace YOUR_GITHUB_URL, YOUR_PERSONAL_WEBSITE_URL, YOUR_PORTFOLIO_URL and YOUR_OTHER_PROJECTS_URL in `src/data/site.ts`. Until replaced, the site displays non-clickable “Link coming later” labels. No contact address has been invented. Update About and Privacy when adding new features or a contact method.

## Review and publishing

1. Compare official topics/marks against the source PDF.
2. Verify every educational claim; use reliable references, not just a topic heading.
3. Use original writing and permitted assets. Cite source pages.
4. Label adapted examples and sample formats. Do not provide copied submissions.
5. Check mobile readability, keyboard controls, downloads and both themes.
6. Keep drafts out of published output. Never claim an actual human review that has not happened.

The supplied source differs internally on the S1.1 title and first internship task/course code. S1.9 says “Any two” but lists one SIP item. `docs/SOURCE-AUDIT.md` records these issues. The UI links to original pages and asks students to confirm actual tasks with their mentor.

Bookmarks/progress/checklists live on the current browser only. The site has no analytics or tracking code. Google Fonts is the only external presentation dependency. Print styles offer A4-friendly pages; PDF download links point to real files. The original curriculum is supplied as a download; no unreviewed subject PDF is exposed.

## Add an interactive quiz

Set `type: "Quizzes"` on a resource and add a `questions` YAML array. Each question has `question`, exactly four `options`, `answer` (0–3), `explanation`, `topic` to revise, and `page` (source PDF page, 1–136). The resource template automatically adds the interactive quiz. AI-assisted quizzes still require human review. The current five-question curriculum check is a separate orientation tool.
