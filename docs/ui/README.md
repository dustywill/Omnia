# UI Documentation

This folder contains documentation for Omnia's user interface system, including components, styling, and assets.

## UI Architecture

Omnia uses a hybrid approach combining:

- **Tailwind CSS**: Utility-first styling for rapid development
- **CSS Modules**: Scoped styles for complex components
- **React Components**: Reusable UI building blocks
- **TypeScript**: Type-safe component interfaces

## Documents

### UI System
- **[COMPONENT_LIBRARY.md](./COMPONENT_LIBRARY.md)** - Complete component library documentation
- **[STYLING_STRATEGY.md](./STYLING_STRATEGY.md)** - Hybrid Tailwind + CSS Modules approach
- **[ASSET_LOADING.md](./ASSET_LOADING.md)** - CSS, images, and other asset handling

## Component Library

### Component Categories

#### 1. Primitive Components (Tailwind-heavy)
- **Button**: Primary, secondary, and icon variants
- **Input**: Text, number, and search inputs
- **Badge**: Status indicators and labels

#### 2. Layout Components (Hybrid)
- **Card**: Content containers with shadows and borders
- **Grid**: Responsive grid layouts
- **Sidebar**: Navigation and tool panels

#### 3. Navigation Components
- **AppNavigation**: Main application navigation with colorful icons
- **StatusBar**: Application status and plugin information

#### 4. Complex Components (CSS Modules-heavy)
- **PluginCard**: Plugin information and controls
- **SettingsForm**: Schema-driven form generation
- **JsonEditor**: JSON configuration editing
- **NotificationSystem**: Toast notifications

### Usage Examples

#### Simple Component
```typescript
import { Button } from '../ui/components';

function MyComponent() {
  return (
    <Button variant="primary" onClick={handleClick}>
      Click me
    </Button>
  );
}
```

#### Complex Component with CSS Modules
```typescript
import { PluginCard } from '../ui/components';
import styles from './MyComponent.module.css';

function MyComponent() {
  return (
    <div className={styles.container}>
      <PluginCard plugin={pluginData} />
    </div>
  );
}
```

## Styling Strategy

### Tailwind CSS
Used for:
- Utility classes (margins, padding, colors)
- Responsive design
- Layout primitives
- Quick prototyping

### CSS Modules
Used for:
- Component-specific styles
- Complex animations
- State-dependent styling
- Scoped style isolation

### Hybrid Approach
```typescript
// Component using both approaches
import styles from './Card.module.css';

function Card({ children, variant = 'default' }) {
  return (
    <div className={`${styles.card} ${styles[variant]} p-4 rounded-lg shadow-md`}>
      {children}
    </div>
  );
}
```

## Asset Management

### CSS Modules Processing
1. **Build Time**: `.module.css` files processed to JavaScript objects
2. **Runtime**: Dynamic loading in browser environment
3. **Development**: Hot reload support for style changes

### Asset Pipeline
1. **Copy Assets**: `scripts/copy-assets.js` copies component assets
2. **Process CSS**: `scripts/process-css-modules.js` converts CSS to JS
3. **Fix Imports**: `scripts/fix-plugin-imports.js` updates import paths

## Development Workflow

### Adding New Component

1. **Create Component Structure**
```bash
mkdir src/ui/components/MyComponent
cd src/ui/components/MyComponent
```

2. **Create Files**
```bash
touch MyComponent.tsx
touch MyComponent.module.css
touch index.ts
```

3. **Implement Component**
```typescript
// MyComponent.tsx
import React from 'react';
import styles from './MyComponent.module.css';

export interface MyComponentProps {
  title: string;
  variant?: 'primary' | 'secondary';
}

export default function MyComponent({ title, variant = 'primary' }: MyComponentProps) {
  return (
    <div className={`${styles.component} ${styles[variant]} p-4 rounded`}>
      <h3 className={styles.title}>{title}</h3>
    </div>
  );
}
```

4. **Update Build Scripts**
```javascript
// scripts/copy-assets.js
const componentDirs = [
  'Button', 'Input', 'Card', 'MyComponent' // Add new component here
];
```

5. **Export Component**
```typescript
// src/ui/components/index.ts
export { default as MyComponent } from './MyComponent';
export type { MyComponentProps } from './MyComponent';
```

### Testing Components

```typescript
// tests/ui/components/MyComponent.test.tsx
import { render, screen } from '@testing-library/react';
import MyComponent from '../../../src/ui/components/MyComponent/MyComponent';

describe('MyComponent', () => {
  test('renders with title', () => {
    render(<MyComponent title="Test Title" />);
    expect(screen.getByText('Test Title')).toBeInTheDocument();
  });

  test('applies variant classes', () => {
    render(<MyComponent title="Test" variant="secondary" />);
    const component = screen.getByText('Test').parentElement;
    expect(component).toHaveClass('secondary');
  });
});
```

## Design System

### Color Palette
- **Primary**: Blue tones for main actions
- **Secondary**: Gray tones for secondary actions
- **Success**: Green for positive feedback
- **Warning**: Orange for caution
- **Error**: Red for errors

### Typography
- **Headings**: Inter font with weight variations
- **Body**: Inter font for readability
- **Code**: Monospace for technical content

### Spacing
- **Base unit**: 4px (0.25rem)
- **Common sizes**: 8px, 16px, 24px, 32px
- **Responsive**: sm, md, lg, xl breakpoints

### Layout Patterns
- **Card-based**: Information grouped in cards
- **Sidebar navigation**: Main navigation pattern
- **Grid layouts**: Responsive plugin displays
- **Form layouts**: Consistent form styling

## Accessibility

### Standards
- **WCAG 2.1 AA**: Target compliance level
- **Keyboard navigation**: Full keyboard support
- **Screen readers**: Proper ARIA labels
- **Color contrast**: Meets accessibility requirements

### Implementation
- Use semantic HTML elements
- Provide proper ARIA attributes
- Ensure keyboard navigation works
- Test with screen readers
- Maintain color contrast ratios

## Performance

### Optimization Strategies
- **CSS Modules**: Scoped styles reduce global CSS
- **Lazy Loading**: Components loaded on demand
- **Tree Shaking**: Unused code eliminated
- **Bundle Splitting**: Separate vendor and app code

### Monitoring
- **Bundle Size**: Track component bundle impact
- **Load Times**: Monitor asset loading performance
- **Runtime Performance**: Check for expensive operations
- **Memory Usage**: Monitor component memory footprint

## Browser Support

### Target Browsers
- **Chrome**: Latest 2 versions
- **Firefox**: Latest 2 versions
- **Safari**: Latest 2 versions
- **Edge**: Latest 2 versions

### Feature Support
- **ES6+**: Modern JavaScript features
- **CSS Grid**: Layout support
- **Flexbox**: Flexible layouts
- **CSS Variables**: Dynamic theming

## Migration Guide

### From Previous Version
1. Update component imports
2. Replace deprecated props
3. Update styling approaches
4. Test component functionality
5. Update documentation

### Breaking Changes
- Document any breaking changes
- Provide migration examples
- Update version numbers
- Test backward compatibility