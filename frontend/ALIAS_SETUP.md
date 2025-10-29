# Path Aliases Setup

This project uses path aliases for cleaner and more maintainable imports.

## 🎯 Available Aliases

| Alias | Path | Description |
|-------|------|-------------|
| `@/*` | `./src/*` | General source directory access |
| `@/components/*` | `./src/components/*` | Component imports |
| `@/lib/*` | `./src/lib/*` | Library and utility imports |
| `@/app/*` | `./src/app/*` | App directory imports |

## 📁 Configuration Files

### TypeScript Configuration (`tsconfig.json`)
```json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./src/*"],
      "@/components/*": ["./src/components/*"],
      "@/lib/*": ["./src/lib/*"],
      "@/app/*": ["./src/app/*"]
    }
  }
}
```

### Next.js Configuration (`next.config.ts`)
```typescript
import path from "path";

const nextConfig: NextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      '@': path.resolve(__dirname, 'src'),
      '@/components': path.resolve(__dirname, 'src/components'),
      '@/lib': path.resolve(__dirname, 'src/lib'),
      '@/app': path.resolve(__dirname, 'src/app'),
    };
    return config;
  },
};
```

## 🚀 Usage Examples

### Before (Relative Imports)
```typescript
import BooksHeader from '../../../components/BooksHeader';
import BooksFilter from '../../../components/BooksFilter';
import { sampleBooks } from '../../../lib/sampleBooks';
```

### After (Alias Imports)
```typescript
// Option 1: Direct component imports
import BooksHeader from '@/components/BooksHeader';
import BooksFilter from '@/components/BooksFilter';
import { sampleBooks } from '@/lib/sampleBooks';

// Option 2: Barrel exports (even cleaner)
import { BooksHeader, BooksFilter, BooksList } from '@/components';
import { sampleBooks } from '@/lib';
```

## 📦 Barrel Exports

The project includes barrel export files for even cleaner imports:

### Components (`src/components/index.ts`)
```typescript
export { BooksHeader, BooksFilter, BooksList } from './BooksHeader';
export { Header, Footer } from './layout';
export { Input } from './ui/input';
```

### Library (`src/lib/index.ts`)
```typescript
export { cn } from './utils';
export { sampleBooks } from './sampleBooks';
export type { Book } from './sampleBooks';
```

## ✨ Benefits

1. **Cleaner Imports**: No more `../../../` relative paths
2. **Better Maintainability**: Easy to refactor file locations
3. **IDE Support**: Better autocomplete and navigation
4. **Consistency**: Standardized import patterns across the project
5. **Type Safety**: Full TypeScript support for all aliases

## 🔧 IDE Configuration

Most modern IDEs (VS Code, WebStorm) will automatically recognize these aliases. For VS Code, you can add this to your `settings.json`:

```json
{
  "typescript.preferences.includePackageJsonAutoImports": "on",
  "typescript.suggest.autoImports": true
}
```

## 📝 Best Practices

1. **Use barrel exports** for related components
2. **Group imports** by type (components, lib, external)
3. **Prefer named exports** over default exports for better tree-shaking
4. **Keep aliases consistent** across the project
5. **Document new aliases** when adding them

## 🎯 Example Project Structure

```
src/
├── components/
│   ├── index.ts          # Barrel exports
│   ├── BooksHeader.tsx
│   ├── BooksFilter.tsx
│   ├── BooksList.tsx
│   └── layout/
│       ├── index.ts
│       ├── Header.tsx
│       └── Footer.tsx
├── lib/
│   ├── index.ts          # Barrel exports
│   ├── utils.ts
│   ├── sampleBooks.ts
│   └── aliases.ts
└── app/
    ├── layout.tsx
    ├── page.tsx
    └── (public)/
        └── books/
            └── page.tsx
```
