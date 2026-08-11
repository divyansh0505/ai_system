# Styling in the Project

This project uses **Emotion**, a CSS-in-JS library, for styling the application. Emotion provides a powerful and flexible way to write styles in JavaScript, offering better component encapsulation and dynamic styling capabilities.

## Icon Library: Lucide React

We use **Lucide React** for icons in this project. Lucide is a modern, lightweight, and customizable icon library. It provides React components for each icon, making it easy to integrate into our React components. Lucide is also tree-shakable, ensuring that only the icons we use are included in the final bundle, keeping the application lightweight.

### Key Features of Lucide React

- **Lightweight**: Each icon is an SVG React component, approximately 1-2 KB in size.
- **Customizable**: Icons can be styled easily with props like `size`, `color`, and `strokeWidth`.
- **Tree-Shakable**: Only the icons you import are included in the bundle.
- **Consistent Design**: Offers a cohesive and modern icon set.

For more information, visit the [Lucide documentation](https://lucide.dev/docs/lucide-react).

## Decision on Emotion

We migrated from Tailwind CSS to Emotion for several key reasons:

1. **Better Style Encapsulation**: While Tailwind CSS provides utility classes, they are global by nature. Emotion's CSS-in-JS approach ensures styles are scoped to components, preventing style leaks when the application is embedded in external environments.

2. **Dynamic Styling**: Emotion makes it easier to create dynamic styles based on props and component state, which is particularly useful for our interactive components.

3. **Type Safety**: Emotion works seamlessly with TypeScript, providing better type checking for styles and reducing runtime errors.

4. **Reduced Bundle Size**: By using Emotion, we can achieve better tree-shaking as only the styles that are actually used in components are included in the final bundle.

5. **Better Developer Experience**: Emotion's syntax is closer to regular CSS, making it more intuitive for developers. It also provides better IDE support with syntax highlighting and autocompletion.

### Challenges with Tailwind CSS in iframe Architecture

While Tailwind CSS is a powerful utility-first framework, it presents several challenges when used in an iframe-based architecture:

1. **Style Isolation Issues**:

   - Tailwind's utility classes are global by default, which can cause conflicts when multiple instances of the application are embedded in different iframes
   - Even with the `prefix` option, there's still a risk of class name collisions with the parent application
   - The `@apply` directive can lead to unexpected style inheritance issues across iframe boundaries

2. **Bundle Size Concerns**:

   - Each iframe instance needs its own copy of the Tailwind CSS bundle
   - The utility-first approach means including many unused classes in each iframe
   - PurgeCSS can help but requires careful configuration to work correctly with iframes

3. **Dynamic Style Management**:

   - Tailwind's JIT (Just-In-Time) compiler needs to be configured separately for each iframe
   - Dynamic class generation can be problematic when styles need to be isolated
   - Responsive design utilities can conflict with parent application breakpoints

4. **Theme Customization**:

   - Tailwind's theme configuration needs to be duplicated across iframes
   - Custom theme values can leak between iframes if not properly isolated
   - Dark mode implementation becomes more complex with multiple iframe instances

5. **Performance Impact**:
   - Multiple iframes with full Tailwind bundles can significantly impact page load time
   - Style recalculation can be expensive when iframes are dynamically created/destroyed
   - Hydration issues can occur when iframes are loaded asynchronously

These challenges led us to choose Emotion, which provides better isolation and more predictable behavior in an iframe-based architecture.

## Key Features of Emotion

- **CSS-in-JS**: Write styles in JavaScript/TypeScript with full CSS support
- **Component Scoping**: Styles are automatically scoped to components
- **Dynamic Styles**: Create styles based on props and component state
- **Server-Side Rendering**: Built-in support for SSR
- **Performance**: Optimized for runtime performance with minimal overhead

## How Emotion is Used in This Project

1. **Styled Components**: We use Emotion's `styled` API to create styled components
2. **CSS Prop**: The `css` prop is used for one-off styles
3. **Theme Support**: We utilize Emotion's theme provider for consistent styling across the application
4. **TypeScript Integration**: All styles are fully typed for better development experience

For more information, visit the [Emotion documentation](https://emotion.sh/docs/introduction).

## Performance Considerations

### 1. Style Optimization

- Use the `css` prop for dynamic styles
- Leverage Emotion's built-in caching
- Implement proper code splitting

### 2. Bundle Size

- Use tree shaking effectively
- Implement proper code splitting
- Optimize dynamic styles

### 3. Server-Side Rendering

- Use Emotion's SSR features
- Implement proper hydration
- Optimize critical CSS

## Best Practices

1. **Style Organization**

   - Keep styles close to components
   - Use theme variables for consistency
   - Implement proper component composition

2. **Performance**

   - Use static styles when possible
   - Implement proper memoization
   - Optimize dynamic styles

3. **Maintainability**

   - Follow consistent naming conventions
   - Document theme variables
   - Keep styles modular

4. **Accessibility**
   - Ensure proper contrast ratios
   - Support dark mode
   - Maintain focus styles
