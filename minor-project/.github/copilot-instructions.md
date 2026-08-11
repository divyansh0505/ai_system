# Bento Widget - Coding Guidelines & Review Standards

## Review Philosophy

**Only comment when you have HIGH CONFIDENCE (>80%) that an issue exists.**

### What to Flag
- **Bugs & Logic Errors** - Code that will break or produce incorrect results
- **Type Safety Violations** - Missing types, `any` usage, incorrect interfaces
- **Architecture Violations** - Code splitting, routing libraries, non-Emotion styling
- **Breaking Changes** - Changes that could break the widget or host websites
- **Missing Tests** - New functionality without corresponding tests

### What to Ignore
- Style preferences already handled by Prettier
- Existing lint errors in unmodified code
- Minor naming suggestions (unless genuinely confusing)
- "Nice to have" refactors unrelated to the PR's purpose
- Documentation that is functional even if imperfect

---

## Architecture Constraints (Flag Violations)

| Constraint | Violation Example |
|------------|-------------------|
| Single-file bundle | Adding `React.lazy()`, dynamic imports, code splitting |
| Emotion only | Tailwind classes, CSS files, inline `style={}` props (use Emotion `css` prop for dynamic styles) |
| No routing | React Router, reach-router, any route-based navigation |
| Zustand for global state | Redux, Context API for global state, excessive prop drilling |
| TypeScript strict | `any` types, missing interfaces, untyped props |

## Code Patterns (Reference Only)

### Component Structure
```typescript
// Props interface required
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// Emotion styled components
const StyledWrapper = styled.div({
  padding: '16px',
});

export const MyComponent = ({ title, onAction }: MyComponentProps) => {
  return <StyledWrapper>{title}</StyledWrapper>;
};
```

### State Management
- **Global state**: Zustand (`src/store/`)
- **Local UI state**: React hooks
- **Data fetching**: TanStack Query

### File Locations
- Components: `src/components/` (tests co-located as `Component.test.tsx`)
- Hooks: `src/hooks/`
- Types: `src/types/`
- API/Services: `src/services/`
- State: `src/store/`

## PR Checklist (For Reviewers)

Only verify these; don't comment unless violated:

- [ ] Changes are minimal and focused on the task
- [ ] No modifications to unrelated files
- [ ] TypeScript compiles without new errors
- [ ] Tests added/updated for new functionality
- [ ] Emotion used for all styling
- [ ] No new heavy dependencies added

## Priority Areas (Review These)

### Security & Safety

* Unsafe code blocks without justification
* Command injection risks (shell commands, user input)
* Path traversal vulnerabilities
* Credential exposure or hardcoded secrets
* Missing input validation on external data
* Improper error handling that could leak sensitive info

### Correctness Issues

* Logic errors that could cause panics or incorrect behavior
* Race conditions in async code
* Resource leaks (files, connections, memory)
* Off-by-one errors or boundary conditions
* Incorrect error propagation (using `unwrap()` inappropriately)
* Optional types that don’t need to be optional
* Booleans that should default to false but are set as optional
* Error context that doesn’t add useful information
* Overly defensive code with unnecessary checks
* Unnecessary comments that restate obvious code behavior

### Architecture & Patterns

* Code that violates existing patterns in the codebase
* Missing error handling (should use `anyhow::Result`)
* Async/await misuse or blocking operations in async contexts
* Improper trait implementations

## Response Format

1. State the problem (1 sentence)
2. Why it matters (1 sentence, if needed)
3. Suggested fix (snippet or specific action)

Example:
This could panic if the vector is empty. Consider using `.get(0)` or adding a length check.
