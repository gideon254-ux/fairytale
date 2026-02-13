# AGENTS.md - Project Tracker Development Guide

## Build, Lint, and Test Commands

| Command           | Description                            |
| ----------------- | -------------------------------------- |
| `npm run dev`     | Start Vite development server          |
| `npm run build`   | Build for production (output to dist/) |
| `npm run preview` | Preview production build locally       |
| `npm run test`    | Run all tests with Vitest              |
| `npm run lint`    | Run ESLint on all JS/TS/JSX/TSX files  |
| `npm run format`  | Format all files with Prettier         |

### Running Single Tests

```bash
# Run a specific test file
npx vitest run src/__tests__/project.test.js

# Run tests matching a pattern
npx vitest -t "should fetch user projects"

# Run with coverage
npx vitest run --coverage
```

### Test Configuration

- Vitest uses `vitest.config.js` with jsdom environment
- Global test utilities available via `setupTests.js`
- Coverage provider: v8 (reports in text/html/json)
- Tests are in `src/__tests__/` directory with `.test.js` extension

## Code Style Guidelines

### Formatting (Prettier)

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2,
  "useTabs": false,
  "bracketSpacing": true,
  "arrowParens": "always"
}
```

### ESLint Rules

- `no-console`: **warn** - Avoid console.log in production code
- `no-debugger`: **error** - Never commit debugger statements
- `no-unused-vars`: **warn** - Remove unused variables

### TypeScript Configuration

- `strict: true` - Enable all strict type-checking options
- `moduleResolution: "bundler"` - Use bundler module resolution
- Paths: `@/*` maps to `./src/*`
- Target: ES2020, Module: ESNext

### Imports Ordering

1. Firebase/firestore imports first
2. Third-party library imports (Chart.js, etc.)
3. Local imports from `./` and `../`

```javascript
import { doc, getDoc } from 'firebase/firestore';
import { Chart } from 'chart.js';
import { getUserProjects } from './project.js';
```

### Naming Conventions

| Type         | Convention              | Example                                |
| ------------ | ----------------------- | -------------------------------------- |
| Functions    | camelCase               | `showDashboard()`, `getUserProjects()` |
| Variables    | camelCase               | `currentProject`, `countdownInterval`  |
| Constants    | SCREAMING_SNAKE_CASE    | `FREE_TIER_LIMIT_REACHED`              |
| DOM Elements | Descriptive with suffix | `projectsList`, `logoutBtn`            |

### Error Handling

Wrap async operations in try/catch blocks. Log errors with `console.error()` and rethrow:

```javascript
async function getUserProjects(uid) {
  try {
    const projectsCol = collection(db, 'users', uid, 'projects');
    const snapshot = await getDocs(projectsCol);
    return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
  } catch (error) {
    console.error('Error getting user projects:', error);
    throw error;
  }
}
```

### DOM Manipulation

Always check if elements exist before accessing them:

```javascript
const projectsList = document.getElementById('projectsList');
if (!projectsList) return;
```

### Async/Await Pattern

Use async/await for all asynchronous operations. Avoid raw promises when possible.

### Firebase Data Patterns

- Use `serverTimestamp()` for created/updated timestamps
- Handle `doc.exists()` checks for document reads
- Use Firestore increment for counter fields
- Structure: `users/{uid}/projects/{projectId}/logs/{logId}`

### Component Structure

1. Import statements at top
2. Module-level variables/constants
3. Private helper functions
4. Public export functions
5. Event listeners at bottom (or in initialization)

### Git Workflow

- Create feature branches from main
- Run `npm run lint` and `npm run test` before committing
- Use conventional commit messages
- Never commit `.env` files or secrets
