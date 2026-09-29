# Dependency Comparison

This document compares the dependency manifest on `chore/update-dependencies` with the previous `main` branch revision.

## Manifest comparison

| Package | Previous range | Current range | Change type |
|---|---:|---:|---|
| `@google/genai` | `^1.29.0` | `^1.52.0` | Compatible minor update |
| `@tailwindcss/vite` | `^4.1.14` | `^4.3.3` | Compatible minor update |
| `@vitejs/plugin-react` | `^5.0.4` | `^5.2.0` | Compatible minor update |
| `dotenv` | `^17.2.3` | `^17.4.2` | Compatible minor update |
| `express` | `^4.21.2` | `^4.22.3` | Compatible patch update |
| `lucide-react` | `^0.546.0` | `^0.546.0` | Unchanged |
| `motion` | `^12.23.24` | `^12.43.0` | Compatible minor update |
| `react` | `^19.0.1` | `^19.3.0` | Compatible minor update |
| `react-dom` | `^19.0.1` | `^19.3.0` | Compatible minor update |
| `react-image-crop` | `^11.0.10` | `^11.1.2` | Compatible minor update |
| `vite` | `^6.2.3` | `^6.2.3` | Manifest range unchanged; lockfile refreshed |

## Files compared

The comparison uses the following repository versions:

- Previous manifest: `package.json` from `origin/main` at `f9b024a`.
- Current manifest: `package.json` from `chore/update-dependencies` at `af79948`.
- Lockfile: `package-lock.json` was regenerated on the current branch. The resulting diff contains 564 additions and 586 deletions.

## Validation snapshot

`npm audit` currently reports zero informational, low, moderate, high, or critical vulnerabilities.

The application type-check and production build remain blocked by an existing source issue unrelated to this comparison: `src/App.tsx` imports a default export from `src/components/AIVideoGenerator.tsx`, but that module does not currently provide one.
