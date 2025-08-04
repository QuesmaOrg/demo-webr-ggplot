## Development Workflow

- Use pnpm as the package manager (configured in package.json)
- Run pnpm lint before any commit (and after major edits as well).
- With each commit (and only commit) increment patch version by one. Unless there is a direct instruction to increase minor (or major) version.

## Code Quality Rules

- NEVER fail silently - always log errors and make failures visible to users when appropriate.
- If a composable is used within only one Vue component, keep it in that component file - do NOT create a separate composable file.
- AVOID defensive code with multiple fallbacks - choose ONE approach, implement it properly, and fail hard with clear errors if it doesn't work. Multiple fallbacks hide real problems and make debugging harder.

## WebR Documentation References

Always reference the official WebR documentation when working with WebR features. Be eager to check and link to relevant sections:

**Official WebR Documentation**: https://docs.r-wasm.org/webr/latest/

### Table of Contents with Links:
- [Getting Started](https://docs.r-wasm.org/webr/latest/getting-started.html)
- [Downloading WebR](https://docs.r-wasm.org/webr/latest/downloading.html)
- [Serving Pages with WebR](https://docs.r-wasm.org/webr/latest/serving.html)
- [Examples using WebR](https://docs.r-wasm.org/webr/latest/examples.html)
- [Worker Communication](https://docs.r-wasm.org/webr/latest/communication.html)
- [Evaluating R Code](https://docs.r-wasm.org/webr/latest/evaluating.html) ⭐ *Key for our composables*
- [Plotting](https://docs.r-wasm.org/webr/latest/plotting.html) ⭐ *Used in our ggplot2 demos*
- [Networking](https://docs.r-wasm.org/webr/latest/networking.html)
- [Working with R Objects](https://docs.r-wasm.org/webr/latest/objects.html) ⭐ *Critical for data handling*
- [Managing R Objects](https://docs.r-wasm.org/webr/latest/objects.html#managing-r-objects)
- [Converting to JavaScript](https://docs.r-wasm.org/webr/latest/convert-js.html) ⭐ *Used extensively*
- [Creating New R Objects](https://docs.r-wasm.org/webr/latest/objects.html#creating-new-r-objects)
- [Installing R Packages](https://docs.r-wasm.org/webr/latest/packages.html) ⭐ *For our library management*
- [Building R Packages](https://docs.r-wasm.org/webr/latest/building.html)
- [Mounting Filesystem Data](https://docs.r-wasm.org/webr/latest/mounting.html) ⭐ *For CSV uploads*
- [WebR API](https://docs.r-wasm.org/webr/latest/api.html)
- [R API](https://docs.r-wasm.org/webr/latest/api/r.html)
- [JavaScript API](https://docs.r-wasm.org/webr/latest/api/js.html) ⭐ *Main reference*

### Key Principles:
- Always link to relevant WebR docs when implementing features
- Use WebR best practices as documented
- Reference specific API methods and their documentation
- Show developers this is a proper WebR showcase, not just a demo

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