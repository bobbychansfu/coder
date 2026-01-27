# Assets Organization Guide

## Where to Put Your Assets

### SVG Images & Icons
**Location:** `public/icons/`

SVG files should be placed in the public folder for optimal performance and easy access.

```
public/
├── icons/           # SVG icons (recommended)
│   ├── trophy.svg
│   ├── flame.svg
│   ├── star.svg
│   └── target.svg
├── images/          # Other images (PNG, JPG, etc.)
└── favicon.ico
```

**Usage:**
```typescript
import Image from "next/image";

<Image
  src="/icons/trophy.svg"
  alt="Trophy"
  width={16}
  height={16}
/>
```

### Why Public Folder?

1. **Direct URL Access**: Files in `public/` are served at the root URL
2. **Next.js Optimization**: Next.js automatically optimizes images in public folder
3. **No Import Required**: Just reference by path `/icons/filename.svg`
4. **Build Performance**: Assets are not bundled, reducing bundle size

### Alternative: Assets in src/

For assets that need to be imported (rare cases):
```
src/fe/shared/assets/
├── icons/
└── images/
```

**Usage:**
```typescript
import TrophyIcon from "@/fe/shared/assets/icons/trophy.svg";
```

## Current Asset Structure

```
public/
└── icons/
    ├── trophy.svg    (Total Solved stat)
    ├── flame.svg     (Current Streak stat)
    ├── star.svg      (Total XP stat)
    └── target.svg    (Global Rank stat)
```

## Best Practices

1. **Use SVG for Icons**: SVGs are scalable and have smaller file sizes
2. **Descriptive Names**: Use clear, descriptive names (e.g., `trophy.svg` not `icon1.svg`)
3. **Organize by Category**: Group similar assets in subdirectories
4. **Optimize Before Upload**: Compress images and optimize SVGs
5. **Consistent Naming**: Use kebab-case for file names (e.g., `user-profile.svg`)

## Asset Types by Location

| Asset Type | Location | Example |
|------------|----------|---------|
| SVG Icons | `public/icons/` | trophy.svg, flame.svg |
| Images | `public/images/` | hero-banner.png |
| Favicons | `public/` | favicon.ico |
| Fonts | `public/fonts/` or via next/font | Inter-Regular.woff2 |
| Static Files | `public/` | robots.txt, sitemap.xml |
