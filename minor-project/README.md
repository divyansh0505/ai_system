# Bento

A lightweight, embeddable chat widget built with React, Emotion, and Framer Motion. Built as an ESM module for easy third-party integration.

## Features

- 🎨 Customizable theming
- 🛡️ Style isolation with react-frame-component
- ⚡ Fast and lightweight (~10MB uncompressed, ~2.7MB gzipped)
- 🔒 Secure and encapsulated
- 🎭 Smooth animations with Framer Motion
- 📱 Responsive design
- 🔌 Easy ESM integration for third-party websites
- 🎯 Auto-initialization support

## Setup

1. **Install [Bun](https://bun.sh) (v1.1.43 or later):**

   ```bash
   brew install oven-sh/bun/bun # homebrew

   curl -fsSL https://bun.sh/install | bash # curl
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```
3. **Start development server:**

   ```bash
   bun run dev
   ```

4. **Build for production:**
   ```bash
   bun run build
   ```

## Third-Party Integration

### Method 1: Auto-Initialize (Recommended)

```html
<!DOCTYPE html>
<html>
  <head>
    <title>My Website</title>
  </head>
  <body>
    <!-- Your website content -->

    <div id="interactnow-inline-widget"></div>

    <!-- Load Widget from CDN -->
    <script type="module" src="https://widget.interactnow.ai"></script>
  </body>
</html>
```

## Configuration

The widget accepts the following configuration options:

```typescript
interface BentoWidgetConfig {
  apiKey: string; // Required: Your API key
  domain: string; // Required: Your domain
  orgId?: string; // Optional: Organization ID
  startFullscreen?: boolean; // Optional: Start in fullscreen mode
  theme?: {
    primary?: string; // Optional: Primary theme color (hex)
  };
}
```

## Architecture

### Development Mode (Local)

- Run `bun run dev` to start Vite dev server
- Works as SPA with hot module reload
- Uses `src/index.tsx` as entry point
- Opens at `http://localhost:5173`

### Production Build

- Run `bun run build` to create widget bundle
- Entry point: `src/widget.tsx`
- Output: `dist/main.js` (single file with CSS bundled)
- Assets: Fonts, sounds, images in `dist/assets/`
- All dependencies (React, Emotion, LiveKit) bundled

### Deployment Environments

#### Development (`dev.bento.humanisys.ai`)

```
S3 Bucket: dev.bento.humanisys.ai/
├── index.html → loads /main.js
├── main.js (widget bundle)
├── assets/ (fonts, sounds, images)
└── public/ (favicon, logos, etc.)
```

#### Staging (`staging.bento.humanisys.ai`)

```
S3 Bucket: staging.bento.humanisys.ai/
├── index.html → loads /main.js
├── main.js (widget bundle)
├── assets/
└── public/
```

#### Production

```
Widget Hosting (widget.interactnow.ai):
├── main.js (widget bundle)
└── assets/

Demo Page (bento.humanisys.ai):
├── index.html → loads https://widget.interactnow.ai
└── public/
```

## Deployment

### Prerequisites

Before first production deploy:

1. **Update CloudFront Distribution ID:**

   ```yaml
   # File: .github/workflows/prod.deploy.yml (line 11)
   WIDGET_CLOUDFRONT_ID: <YOUR_ACTUAL_CLOUDFRONT_ID>
   ```

2. **Verify Infrastructure:**
   - S3 bucket `widget.interactnow.ai` exists
   - CloudFront distribution configured with `main.js` as default root object
   - GitHub Actions has AWS credentials (IAM role)
   - Permissions to upload to S3 and invalidate CloudFront

### Deployment Workflows

#### Development Deploy

- Trigger: Manual (workflow_dispatch)
- Builds widget and deploys to `dev.bento.humanisys.ai`
- Widget loads locally from `/main.js`

#### Staging Deploy

- Trigger: Manual (workflow_dispatch)
- Builds widget and deploys to `staging.bento.humanisys.ai`
- Widget loads locally from `/main.js`

#### Production Deploy

- Trigger: Push to `main` branch
- Two-stage deployment:
  1. **Widget**: Deploys to `widget.interactnow.ai`
     - Sets 1-year immutable cache
     - Invalidates CloudFront
  2. **Demo Page**: Deploys to `bento.humanisys.ai`
     - Loads widget from CDN
     - Sets 5-minute cache for HTML

### Testing Deployment

```bash
# 1. Build locally
bun run build

# 2. Verify output
ls -lh dist/
# Should show main.js (~9.6MB) and assets/

# 3. Test locally
cp index.html dist/
bun dist/index.html
# Open http://localhost:3000

# 4. Deploy to dev/staging first
# Trigger from GitHub Actions UI

# 5. Deploy to production
git push origin main
```

### Post-Deployment Verification

**Widget Hosting:**

- [ ] `https://widget.interactnow.ai` returns main.js
- [ ] `https://widget.interactnow.ai/assets/fonts/` has fonts
- [ ] CloudFront compression enabled (gzip/brotli)
- [ ] Cache headers correct (1 year for assets)

**Demo Page:**

- [ ] `https://bento.humanisys.ai` loads correctly
- [ ] Widget loads from `widget.interactnow.ai`
- [ ] No console errors
- [ ] Widget button appears bottom-right
- [ ] Chat opens on click

## Development

### Project Structure

```
src/
  ├── components/              # React components
  │   ├── ActionBar/
  │   ├── AudioWaveform/
  │   ├── ErrorBoundary/
  │   ├── FrameWrapper/
  │   ├── Message*/
  │   ├── VideoCard/
  │   └── Widget*.tsx
  ├── hooks/                   # Custom React hooks
  ├── lib/                     # Library code (LiveKit, API)
  ├── modules/                 # Feature modules (calendar, demo, intro)
  ├── services/                # Services (analytics, auth, API)
  ├── store/                   # Zustand state management
  ├── styles/                  # Global styles and theme
  ├── tools/                   # AI tools integration
  ├── types/                   # TypeScript types
  ├── utils/                   # Utility functions
  ├── index.tsx                # Dev server entry point
  └── widget.tsx               # Widget library entry point

.github/workflows/
  ├── dev.deploy.yml           # Dev deployment
  ├── staging.deploy.yml       # Staging deployment
  └── prod.deploy.yml          # Production deployment

public/                        # Static assets
  ├── assets/fonts/            # Web fonts
  ├── sounds/                  # Audio files
  └── *.png, *.ico, etc.       # Icons and images
```

### Available Scripts

- `bun run dev` - Start development server (SPA mode)
- `bun run build` - Build widget for production (library mode)
- `bun run preview` - Preview production build
- `bun run lint` - Run ESLint
- `bun run format` - Format code with Prettier
- `bun run test` - Run tests with Vitest
- `bun run test:coverage` - Run tests with coverage
- `bun run test:ui` - Run tests with UI

### Build Output

```
dist/
├── main.js                    # 9.6MB (2.7MB gzipped) - Widget bundle
├── assets/
│   └── fonts/                 # Web fonts (separate)
├── sounds/                    # Audio files
└── *.png, *.ico, etc.         # Public assets
```

### Key Technologies

- **React 18** - UI framework
- **Emotion** - CSS-in-JS (bundled inline, no separate CSS file)
- **Zustand** - State management
- **Framer Motion** - Animations
- **LiveKit** - Real-time communication
- **Radix UI** - Accessible components
- **TypeScript** - Type safety
- **Vite** - Build tool (library mode)
- **PostHog** - Analytics


## Performance

- **Bundle Size:** ~10MB uncompressed, ~2.7MB gzipped
- **Load Time:** ~1-2s on 3G, ~200-500ms on cable/fiber
- **Includes:** React, React-DOM, Emotion, LiveKit, all dependencies
- **Code Splitting:** Disabled (single file for simplicity)
- **Caching:** Aggressive (1 year immutable for widget assets)

## Documentation

- [Project Overview](docs/overview.md)
- [Styling Guide](docs/styling.md)
- [Testing Guide](docs/testing.md)
- [FAQ](docs/faq.md)


## License

Proprietary - Humanisys AI

