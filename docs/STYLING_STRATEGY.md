# Omnia Hybrid Styling Strategy

This document outlines the hybrid Tailwind CSS + CSS Modules styling approach for Omnia, incorporating your existing color palette and design system.

## Overview

Omnia uses a **hybrid styling approach** that combines:
- **Tailwind CSS** for utility-first styling and rapid prototyping
- **CSS Modules** for component-specific complex styles and encapsulation
- **CSS Custom Properties** for design tokens and theme management

## Design System Foundation

### Color Palette

Your existing color palette has been fully integrated into the Tailwind configuration:

```css
/* Neutral colors (n10-n95) */
neutral-10: #15191e  /* Darkest */
neutral-30: #454e59  /* Text secondary */
neutral-80: #caced3  /* Borders */
neutral-95: #eceeee  /* Background light */

/* Blue colors (b10-b95) - Brand colors */
blue-30: #1555b2     /* Brand Primary */
blue-40: #1e6de6     /* Action Blue */

/* Semantic colors */
primary: #1555b2     /* Brand Primary */
action: #1e6de6      /* Action Blue */
accent: #ffcd08      /* Brand Accent (yellow) */
success: #1da53f     /* Success (green) */
warning: #eb6400     /* Warning (orange) */
danger: #d31d23      /* Danger (red) */
info: #0cbbbb        /* Info (cyan) */
```

### CSS Variables

All colors are available as CSS custom properties for maximum flexibility:

```css
/* Semantic theme colors */
--tt-color-primary: #1555b2
--tt-color-background: #eceeee (light) / #15191e (dark)
--tt-color-surface: #ffffff (light) / #2e343d (dark)
--tt-color-text-primary: #15191e (light) / #e3e7e8 (dark)
```

## Styling Strategy by Component Type

### 1. Utility Components (Tailwind-Heavy)

Use Tailwind for simple, utility-focused components:

**Examples**: Buttons, badges, simple layouts, spacing

```jsx
// Button component - mostly Tailwind
function Button({ variant = 'primary', children, ...props }) {
  const baseClasses = 'px-4 py-2 rounded-lg font-medium transition-colors focus:outline-none focus:ring-2';
  
  const variants = {
    primary: 'bg-primary text-white hover:bg-blue-20 focus:ring-blue-40/20',
    secondary: 'bg-neutral-80 text-neutral-20 hover:bg-neutral-70 focus:ring-neutral-60/20',
    action: 'bg-action text-white hover:bg-blue-30 focus:ring-action/20',
    success: 'bg-success text-white hover:bg-green-30 focus:ring-success/20',
  };
  
  return (
    <button 
      className={`${baseClasses} ${variants[variant]}`}
      {...props}
    >
      {children}
    </button>
  );
}
```

### 2. Layout Components (Hybrid Approach)

Combine Tailwind for spacing/layout with CSS Modules for complex behavior:

**Examples**: Cards, grids, navigation

```jsx
// Card.tsx
import styles from './Card.module.css';

function Card({ children, className = '', elevated = false }) {
  return (
    <div className={`
      bg-theme-surface border-theme rounded-lg p-6 
      ${elevated ? 'shadow-lg' : 'shadow-md'} 
      ${styles.card} 
      ${className}
    `}>
      {children}
    </div>
  );
}
```

```css
/* Card.module.css */
.card {
  background-color: var(--tt-color-surface);
  border: 1px solid var(--tt-color-border);
  transition: all 200ms ease-in-out;
}

.card:hover {
  transform: translateY(-2px);
  box-shadow: var(--tt-shadow-lg);
}

/* Complex responsive behavior */
.card[data-state="collapsed"] {
  height: 60px;
  overflow: hidden;
}

.card[data-state="expanded"] {
  height: auto;
  animation: expandCard 200ms ease-out;
}

@keyframes expandCard {
  from { height: 60px; }
  to { height: auto; }
}
```

### 3. Complex Components (CSS Modules-Heavy)

Use CSS Modules for components with complex states, animations, or business logic:

**Examples**: Plugin cards, settings forms, file explorers

```jsx
// PluginCard.tsx
import styles from './PluginCard.module.css';

function PluginCard({ plugin, status, onToggle }) {
  return (
    <div className={`${styles.pluginCard} ${styles[status]}`}>
      <div className="flex items-center justify-between p-4">
        <div className={styles.pluginInfo}>
          <h3 className="text-lg font-semibold text-theme-primary">
            {plugin.name}
          </h3>
          <p className="text-sm text-theme-secondary">
            {plugin.description}
          </p>
        </div>
        
        <div className={styles.statusIndicator}>
          <button 
            onClick={onToggle}
            className={`${styles.toggleButton} ${status === 'active' ? styles.active : ''}`}
          >
            {status}
          </button>
        </div>
      </div>
      
      {status === 'error' && (
        <div className={styles.errorBanner}>
          <span className="text-danger">⚠ Plugin failed to load</span>
        </div>
      )}
    </div>
  );
}
```

```css
/* PluginCard.module.css */
.pluginCard {
  background-color: var(--tt-color-surface);
  border: 2px solid var(--tt-color-border);
  border-radius: var(--tt-radius-lg);
  transition: all 200ms ease-in-out;
  position: relative;
  overflow: hidden;
}

.pluginCard.active {
  border-color: var(--tt-color-primary);
  background: linear-gradient(135deg, 
    var(--tt-color-surface) 0%, 
    var(--tt-palette--b95) 100%);
}

.pluginCard.error {
  border-color: var(--tt-color-danger);
  background: linear-gradient(135deg, 
    var(--tt-color-surface) 0%, 
    var(--tt-palette--r95) 100%);
}

.pluginCard.loading {
  border-color: var(--tt-color-info);
}

.pluginCard.loading::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 2px;
  background: linear-gradient(90deg, 
    transparent, 
    var(--tt-color-info), 
    transparent);
  animation: loading 1.5s infinite;
}

@keyframes loading {
  0% { left: -100%; }
  100% { left: 100%; }
}

.statusIndicator {
  display: flex;
  align-items: center;
  gap: var(--tt-space-2);
}

.toggleButton {
  padding: var(--tt-space-2) var(--tt-space-3);
  border-radius: var(--tt-radius-md);
  border: 1px solid var(--tt-color-border);
  background: var(--tt-color-surface);
  color: var(--tt-color-text-secondary);
  font-size: var(--tt-font-size-sm);
  cursor: pointer;
  transition: all 150ms ease-in-out;
}

.toggleButton:hover {
  background: var(--tt-color-background);
  transform: scale(1.05);
}

.toggleButton.active {
  background: var(--tt-color-primary);
  color: white;
  border-color: var(--tt-color-primary);
}

.errorBanner {
  background: var(--tt-palette--r95);
  padding: var(--tt-space-2) var(--tt-space-4);
  border-top: 1px solid var(--tt-palette--r80);
}
```

## Theme Management

### CSS Variables Approach

```css
/* Light theme (default) */
:root {
  --tt-color-background: var(--tt-color-background-light);
  --tt-color-surface: var(--tt-color-surface-light);
  --tt-color-text-primary: var(--tt-color-text-primary-light);
}

/* Dark theme */
.dark {
  --tt-color-background: var(--tt-color-background-dark);
  --tt-color-surface: var(--tt-color-surface-dark);
  --tt-color-text-primary: var(--tt-color-text-primary-dark);
}
```

### Theme Switching

```jsx
// ThemeProvider.tsx
function ThemeProvider({ children }) {
  const [theme, setTheme] = useState('light');
  
  useEffect(() => {
    document.documentElement.className = theme;
  }, [theme]);
  
  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

## Best Practices

### When to Use Tailwind

✅ **Use Tailwind for:**
- Spacing and layout (`p-4`, `m-2`, `flex`, `grid`)
- Simple color applications (`bg-primary`, `text-success`)
- Responsive design (`md:flex`, `lg:grid-cols-3`)
- Basic interactions (`hover:bg-gray-100`)
- Typography (`text-lg`, `font-semibold`)

### When to Use CSS Modules

✅ **Use CSS Modules for:**
- Complex animations and transitions
- Component-specific state styles
- Multi-step hover/focus effects
- Business logic-driven styling
- Complex pseudo-selectors
- Component variants with lots of CSS

### Hybrid Examples

```jsx
// Hybrid approach - Tailwind for utilities, CSS Modules for complexity
function SearchInput({ onSearch, isLoading }) {
  return (
    <div className={`relative ${styles.searchContainer}`}>
      <input
        className="w-full px-4 py-2 pl-10 pr-12 bg-theme-surface border-theme rounded-lg focus:outline-none"
        placeholder="Search plugins..."
        onChange={onSearch}
      />
      
      {/* Tailwind for positioning, CSS Modules for complex animation */}
      <div className={`absolute left-3 top-1/2 transform -translate-y-1/2 ${styles.searchIcon} ${isLoading ? styles.loading : ''}`}>
        <SearchIcon />
      </div>
      
      {/* CSS Modules for custom loading state */}
      {isLoading && (
        <div className={`absolute right-3 top-1/2 transform -translate-y-1/2 ${styles.spinner}`} />
      )}
    </div>
  );
}
```

```css
/* SearchInput.module.css */
.searchContainer {
  position: relative;
}

.searchIcon {
  transition: all 200ms ease-in-out;
}

.searchIcon.loading {
  animation: pulse 1s infinite;
}

.spinner {
  width: 16px;
  height: 16px;
  border: 2px solid var(--tt-color-border);
  border-top: 2px solid var(--tt-color-primary);
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
```

## File Organization

```
src/ui/styles/
├── variables.css        # Design tokens and CSS custom properties
├── tailwind.css        # Tailwind base + custom component classes
└── globals.css         # Global styles and resets

src/ui/components/
├── Button/
│   ├── Button.tsx      # Tailwind-heavy component
│   └── Button.stories.tsx
├── Card/
│   ├── Card.tsx        # Hybrid component
│   ├── Card.module.css # Complex styles
│   └── Card.stories.tsx
└── PluginCard/
    ├── PluginCard.tsx        # CSS Modules-heavy
    ├── PluginCard.module.css # Complex business logic styles
    └── PluginCard.stories.tsx
```

## Implementation Guidelines

1. **Start with Tailwind** for new components
2. **Add CSS Modules** when complexity increases
3. **Use CSS variables** for dynamic theming
4. **Prefer composition** over large CSS files
5. **Document complex patterns** in component stories
6. **Test with both themes** during development

This hybrid approach gives you the speed of Tailwind for common patterns while maintaining the power of CSS Modules for complex component behavior, all built on your existing well-designed color palette.