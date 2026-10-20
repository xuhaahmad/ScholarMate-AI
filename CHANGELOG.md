# ScholarMate AI — Changelog

All notable changes to ScholarMate AI are documented here.

## Versioning

- **X.0.0** — Major architectural or application-level changes
- **X.Y.0** — New features or functionality
- **X.Y.Z** — Bug fixes and minor corrections


## [2.0.0] — Unreleased

### Security
- Removed the public `/api/test-grok` and `/api/test-analysis` endpoints.
- Added request validation, a 10 KB body limit, per-IP rate limiting, an hourly search budget and safe error responses.
- Provider calls now have hard deadlines, are cancelled on timeout and are never retried automatically.
- CORS is off by default; logs no longer contain student profiles or provider responses.
- AI-generated links are only trusted when backed by retrieved pages.

### Added
- Up to 6 targeted web searches per student search, with coverage for many study destinations.
- Source verification: scholarships and facts are only shown when the source page supports them.
- Official / third-party / unverified source labels and verified application status.
- Degree level, nationality and CGPA scale in the profile, with transparent eligibility matching.
- Country filter, pagination and honest coverage notes on the results page.
- Caching of identical searches and reuse of web-search results.
- Local mock mode (`npm run dev:mock`) and backend and frontend test suites.

### Fixed
- "Visit Official Website" now opens a verified official link or explains why none is available.
- Removed the misleading "Match Score" percentage and "AI Recommended" badge.
- Searching the results no longer crashes when a result has no country or university.
- Loading no longer spins forever on errors and offers Retry / Edit Profile.

### Removed
- Unused prototype sample data and components (`src/data/scholarships.js`, `utils/matcher.js`, `utils/explanation.js`, `AIAdvisor`, `Badge`, `Button`, `FeatureCard`, `ProfileSummary`).


## [1.2.0] — 2026-09-16

### Added
- Added a dedicated About section.
- Added an About page explaining the motivation and purpose behind ScholarMate AI.
- Added About navigation to the main navbar.
- Added ScholarMate's centralized theme colors to the About page.


## [1.1.0]

### Added
- Added AI-powered scholarship search.
- Added Tavily web search integration.
- Added Groq AI scholarship analysis.
- Added student profile-based scholarship matching.
- Added degree-level matching.
- Added structured scholarship results.
- Added scholarship eligibility status.


## [1.0.0]

### Initial Release
- ScholarMate AI website foundation.
- Home page.
- Student profile page.
- Scholarship results page.
- Scholarship details page.
- Navigation and reusable UI components.
- Initial scholarship data and matching structure.