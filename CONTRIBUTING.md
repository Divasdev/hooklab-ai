# Contributing to HookLab.AI

Thanks for your interest in improving HookLab.AI! Here are guidelines for development and code quality.

## Development Workflow

1. Clone and install dependencies:
   ```bash
   npm install
   ```

2. Run test suites:
   ```bash
   npm run test:relevance
   ```

3. Validate TypeScript and bundle build:
   ```bash
   npm run build
   ```

## Commit Conventions

We adhere to conventional commits:
- `feat(...)`: New user-facing or technical capabilities
- `fix(...)`: Bug fixes and regressions
- `style(...)`: CSS, aesthetics, theme adjustments
- `docs(...)`: Documentation and guide updates
- `test(...)`: Test cases and assertion improvements
- `refactor(...)`: Internal code cleanups without behavioral change
- `chore(...)`: Tooling, scripts, configuration

## Code Style

- Use ESLint and Prettier (`npm run format` / `npm run lint`).
- Maintain TypeScript strictness.
- Preserve responsive design and dark-first palette tokens (`--bg`, `--surface`, `--accent-amber`, `--accent-cyan`).
