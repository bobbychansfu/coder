# Shared Components & Resources

This folder contains all shared/reusable components, styles, constants, and utilities used across the application.
Feature-specific UI lives under `src/fe/<feature>` (for example, `src/fe/dashboard`).

## Folder Structure

```
src/fe/shared/
├── components/         # Reusable React components
│   ├── layout/        # Layout components (Navbar, AppShell, etc.)
│   └── index.ts       # Component exports
├── styles/            # CSS Module files (*.module.css)
├── constants/         # Constant values, configs, enums
├── contexts/          # React Context providers
├── providers/         # Provider components
├── utils/             # Utility functions and helpers
└── index.ts           # Main export file
```

## Usage

### Importing Components

```typescript
// Import from shared
import { Navbar, AppShell } from "@/fe/shared";

// Or import specific category
import { Navbar } from "@/fe/shared/components/layout/Navbar";
```

### CSS Modules

All components use CSS modules instead of inline styles. CSS module files are located in `src/fe/shared/styles/`.

Example:
```typescript
// Component
import styles from "../../styles/Navbar.module.css";

function Navbar() {
  return <nav className={styles.navbar}>...</nav>;
}
```

```css
/* Navbar.module.css */
.navbar {
  background-color: white;
  padding: 16px;
}
```

### SVG Images

SVG icons and images are stored in the `public/icons/` directory and can be referenced directly:

```typescript
<Image src="/icons/trophy.svg" alt="Trophy" width={16} height={16} />
```

## Component Categories

### Layout Components
- **AppShell**: Main application wrapper with navigation
- **Navbar**: Top navigation bar

### Dashboard Components
Dashboard components live in `src/fe/dashboard/components`.

## Adding New Components

1. Create the component file in the appropriate subfolder
2. Create a CSS module file in `src/fe/shared/styles/`
3. Export the component in `src/fe/shared/components/index.ts`
4. Import and use: `import { YourComponent } from "@/fe/shared"`

## Best Practices

1. **Use CSS Modules**: Avoid inline styles, use CSS modules for styling
2. **Keep Components Reusable**: Components in `shared/` should be generic and reusable
3. **Type Safety**: Always use TypeScript interfaces for props
4. **Naming Convention**: Use PascalCase for components, camelCase for utilities
5. **Co-location**: Keep component-specific logic close to the component
