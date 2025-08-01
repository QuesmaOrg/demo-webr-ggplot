## Development Workflow

- Run pnpm lint before any commit (and after major edits as well).
- With each commit (and only commit) increment patch version by one. Unless there is a direct instruction to increase minor (or major) version.

## Code Quality Rules

- NEVER fail silently - always log errors and make failures visible to users when appropriate.