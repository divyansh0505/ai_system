# Frequently Asked Questions

## Framework Selection

### Why not use Next.js, Remix, or TanStack Start?

These frameworks are designed for full-stack applications and include many features we don't need:

- Server-side rendering
- Routing
- API routes
- File-based routing
- Larger bundle size
- More complex build process

Our chat widget is a client-side only component that needs to be embedded in other websites. A simpler stack with React and Vite is more appropriate.

### Why Tailwind CSS instead of other styling solutions?

Tailwind CSS was chosen because:

- Utility-first approach reduces CSS bundle size
- Great developer experience
- Easy to maintain
- Good performance
- Works well with Shadow DOM for style isolation

See [styling.md](./styling.md) for detailed styling strategies.

## Architecture

### Why no routing?

The chat widget is a single-view application where all interactions happen within the widget. We use state management (Zustand) instead of routing to handle different views:

```typescript
interface ChatState {
  view: "welcome" | "chat" | "settings";
  isOpen: boolean;
  // other state properties
}
```

Benefits:

- Simpler architecture
- Smaller bundle size
- Better performance
- Easier maintenance
- No URL management needed

### How do we handle style isolation?

We use Shadow DOM as the primary isolation mechanism, combined with Tailwind CSS. This approach:

- Prevents style leaks in both directions
- Eliminates need for class prefixes
- Provides native browser support
- Ensures consistent styling

See [styling.md](./styling.md) for detailed implementation.

## Performance

### How do we optimize bundle size?

1. **Tree Shaking**

   - Configure Tailwind to only include used styles
   - Remove unused CSS in production build

2. **Code Splitting**

   - Split styles by component
   - Load styles on demand
   - Use dynamic imports for non-critical components

3. **Critical CSS**
   - Extract and inline critical CSS
   - Load non-critical styles asynchronously

### How do we handle caching?

1. **API Caching**

   - Use TanStack Query for API caching
   - Implement request deduplication
   - Handle optimistic updates

2. **Asset Caching**
   - Use content hashing for cache busting
   - Implement proper cache headers
   - Configure CDN caching

## Security

### How do we handle security?

1. **CORS Configuration**

   - Proper CORS headers
   - Secure API endpoints
   - Validate origins

2. **CSP Headers**

   - Configure Content Security Policy
   - Restrict resource loading
   - Prevent XSS attacks

3. **API Security**
   - API key validation
   - Rate limiting
   - Input sanitization

## Integration

### How do other websites embed the widget?

```html
<script>
  window.CHAT_WIDGET_CONFIG = {
    apiKey: "your-api-key",
    // other configuration options
  };
</script>
<script src="https://your-cdn.com/chat-widget.js"></script>
```

### How do we handle configuration?

The widget accepts configuration through:

1. **Global Config**

   - Set via `window.CHAT_WIDGET_CONFIG`
   - Applied before widget initialization

2. **Runtime Config**

   - Updated via widget API
   - Applied during runtime

3. **Default Config**
   - Fallback values
   - Sensible defaults

## Development

### How do we handle state management?

We use Zustand for state management because:

- Lightweight and simple
- Perfect for widget-level state
- Easy to implement caching
- Small bundle size
- Great TypeScript support

### How do we handle theming?

We use CSS Custom Properties for theming:

```css
:host {
  --chat-primary: theme("colors.blue.500");
  --chat-background: theme("colors.white");
  --chat-text: theme("colors.gray.900");
  /* other theme variables */
}
```

### What are the bundle sizes of our third-party libraries?

1. **Core Dependencies**

   - React: ~7.3kB (minified + gzipped)
   - React DOM: ~39.4kB (minified + gzipped)
   - TypeScript: ~0kB (compiled to JavaScript)

2. **UI and Styling**

   - Tailwind CSS: ~10-15kB (minified + gzipped, with PurgeCSS)
   - Radix UI: ~5-10kB (minified + gzipped, tree-shaken)
   - Framer Motion: ~12.7kB (minified + gzipped)

3. **State Management and Data Fetching**

   - Zustand: ~1.1kB (minified + gzipped)
   - TanStack Query: ~12.8kB (minified + gzipped)

4. **Build Tools**
   - Vite: ~0kB (development only)
   - PostCSS: ~0kB (build time only)

Total estimated bundle size (production, minified + gzipped):

- Core: ~46.7kB
- UI and Styling: ~27.7-37.7kB
- State Management: ~13.9kB
- **Total: ~88.3-98.3kB**

Note: These sizes are approximate and can vary based on:

- Features used
- Tree shaking effectiveness
- Compression settings
- Browser caching
- Code splitting implementation

### How do we optimize third-party library usage?

1. **Tree Shaking**

   - Use ES modules
   - Configure proper sideEffects
   - Use named imports

2. **Code Splitting**

   - Split by route/feature
   - Lazy load non-critical components
   - Use dynamic imports

3. **Bundle Analysis**

   - Regular bundle size monitoring
   - Identify and remove unused code
   - Optimize imports

4. **Caching Strategy**
   - Proper cache headers
   - Content hashing
   - CDN configuration

## Maintenance

### How do we handle updates?

1. **Versioning**

   - Semantic versioning
   - Changelog maintenance
   - Breaking changes documentation

2. **Migration Guides**

   - Step-by-step instructions
   - Code examples
   - Common issues

3. **Deprecation Policy**
   - Clear deprecation notices
   - Migration paths
   - Support timeline

### How do we handle testing?

1. **Unit Tests**

   - Component testing
   - State management testing
   - Utility function testing

2. **Integration Tests**

   - Widget integration testing
   - API integration testing
   - Cross-browser testing

3. **E2E Tests**
   - User flow testing
   - Performance testing
   - Accessibility testing
