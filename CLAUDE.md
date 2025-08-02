## Development Workflow

- Use pnpm as the package manager (configured in package.json)
- Run pnpm lint before any commit (and after major edits as well).
- With each commit (and only commit) increment patch version by one. Unless there is a direct instruction to increase minor (or major) version.

## Code Quality Rules

- NEVER fail silently - always log errors and make failures visible to users when appropriate.

## Testing Philosophy

- DON'T test implementation details like "finding messages with specific text" - these are non-tests
- DON'T test trivial functionality that just confirms code does what it was written to do
- DO test actual business logic and user-facing behavior that could realistically break

## Type Safety Requirements

- AVOID using `any` types to mask type checking - this defeats the purpose of TypeScript
- AVOID using `as` casting without proper validation - it bypasses type safety
- DO import types directly from libraries when available
- DO use type guards and runtime validation when interfacing with untyped external systems
- AVOID patterns like `export type WebRInstance = any` - these mask real type safety issues
- AVOID creating type aliases that just re-export types - import directly instead
- ALL functions must have explicit return types - this is enforced by ESLint rules