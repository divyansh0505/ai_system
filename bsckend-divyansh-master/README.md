# express-template

A fast, modern backend service built with [Bun](https://bun.sh), Express, and MongoDB.

---

## Table of Contents

- [Features](#features)
- [Project Structure](#project-structure)
- [Installation](#installation)
- [Configuration](#configuration)
- [Scripts](#scripts)
- [Linting & Formatting](#linting--formatting)
- [Git Hooks](#git-hooks)
- [Docker](#docker)
- [Environment Variables](#environment-variables)
- [License](#license)

---

## Features

- Bun runtime for fast JS/TS execution
- Express server with modular routing
- MongoDB integration via Mongoose
- Configurable via environment variables
- Pre-configured linting, formatting, and git hooks

---

## Project Structure

```
.
├── src/
│   ├── controllers/   # Route controllers
│   ├── db/            # Database connection logic
│   ├── routes/        # Express route definitions
│   ├── services/      # Business logic/services
│   ├── utils/         # Utility functions (e.g., logger)
│   └── index.ts       # Main entry point
├── config/
│   └── index.ts       # Centralized configuration
├── .husky/            # Git hooks (pre-commit)
├── .prettierrc.json   # Prettier config
├── eslint.config.js   # ESLint config
├── package.json
├── bun.lockb
├── dockerfile
└── README.md
```

---

## Installation

1. **Install [Bun](https://bun.sh) (v1.1.43 or later):**
   ```bash
   curl -fsSL https://bun.sh/install | bash
   ```

2. **Install dependencies:**
   ```bash
   bun install
   ```

---

## Configuration

All configuration is managed via environment variables and the `config/index.ts` file.

### Main Config Options

- **Environment:**  
  `NODE_ENV` (`local` | `development` | `production`)
- **Server Port:**  
  `PORT` (default: `8000`)
- **MongoDB URI:**  
  `MONGO_URI` (required for DB connection)

See [Environment Variables](#environment-variables) for details.

---

## Scripts

- **Development (with hot reload):**
  ```bash
  bun run dev
  ```
- **Compile to native binary:**
  ```bash
  bun run compile
  ```
- **Start compiled binary:**
  ```bash
  bun run start
  ```
- **Clean build artifacts:**
  ```bash
  bun run clean
  ```

---

## Linting & Formatting

- **Lint:**  
  Uses ESLint with recommended JS/TS settings.
  ```bash
  bunx eslint .
  ```
- **Format:**  
  Uses Prettier with the following config:
  ```json
  {
    "singleQuote": true,
    "trailingComma": "all",
    "tabWidth": 2
  }
  ```
  Run:
  ```bash
  bunx prettier --write .
  ```

---

## Git Hooks

- **Pre-commit:**  
  Managed by Husky and lint-staged.  
  On commit, runs ESLint and Prettier on staged files:
  ```
  .husky/pre-commit
  ```
  (Runs: `bunx lint-staged`)

---

## Docker

Build and run the app in a container:

```bash
# Build the Docker image
docker build -t mutton .

# Run the container
docker run -p 8000:8000 --env-file .env mutton
```

- The Dockerfile uses a multi-stage build for a minimal final image.
- Exposes port `8000` by default.

---

## Environment Variables

Create a `.env` file in the project root with the following:

```
NODE_ENV=development
PORT=8000
MONGO_URI=mongodb://localhost:27017/your-db
```

- **NODE_ENV:** `local`, `development`, or `production`
- **PORT:** Port for the server (default: 8000)
- **MONGO_URI:** MongoDB connection string

---

## License

MIT
