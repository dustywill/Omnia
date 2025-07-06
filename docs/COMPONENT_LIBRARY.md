# Omnia Component Library

This document provides comprehensive documentation for the Omnia component library, built with a hybrid Tailwind CSS + CSS Modules approach.

## Overview

The Omnia component library consists of 18 production-ready components organized into five categories based on their styling approach:

- **Primitive Components** (Tailwind-heavy): Basic UI elements
- **Layout Components** (Hybrid approach): Structural and navigation components  
- **Complex Components** (CSS Modules-heavy): Advanced functionality with complex states
- **Schema-Driven Components** (CSS Modules-heavy): Automatic form generation and settings management
- **Settings Components** (CSS Modules-heavy): Complete configuration management interface

All components are built with TypeScript, support both light and dark themes, and follow the established design system using the existing color palette.

## Component Categories

### 1. Primitive Components (Tailwind-Heavy)

These components primarily use Tailwind CSS utilities for styling with minimal CSS Modules usage.

#### Button
**Location**: `src/ui/components/Button/Button.tsx`

A versatile button component with multiple variants and sizes.

**Props**:
```typescript
interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'action' | 'success' | 'warning' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}
```

**Usage**:
```jsx
import { Button } from '@/ui/components';

// Primary button (default)
<Button onClick={handleClick}>Submit</Button>

// Action button with large size
<Button variant="action" size="lg">Get Started</Button>

// Warning button
<Button variant="warning">Delete Item</Button>

// Ghost button for subtle actions
<Button variant="ghost">Cancel</Button>
```

**Features**:
- 7 semantic variants using design system colors
- 3 sizes (sm, md, lg)
- Consistent focus states and accessibility
- Disabled state handling
- Hover and focus animations

#### Input
**Location**: `src/ui/components/Input/Input.tsx`

A form input component with validation states and label support.

**Props**:
```typescript
interface InputProps {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
  className?: string;
}
```

**Usage**:
```jsx
import { Input } from '@/ui/components';

// Basic input with label
<Input label="Email Address" type="email" />

// Input with error state
<Input 
  label="Password" 
  type="password" 
  error="Password must be at least 8 characters"
/>

// Input with helper text
<Input 
  label="Username" 
  helperText="Must be unique across the platform"
/>
```

**Features**:
- Label and helper text support
- Error state with validation styling
- Icon support for enhanced UX
- Consistent focus states
- Accessible form controls

#### Badge
**Location**: `src/ui/components/Badge/Badge.tsx`

Status and category indicators with semantic color variants.

**Props**:
```typescript
interface BadgeProps {
  variant?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger' | 'info' | 'neutral';
  size?: 'sm' | 'md' | 'lg';
  children: React.ReactNode;
  className?: string;
}
```

**Usage**:
```jsx
import { Badge } from '@/ui/components';

// Status badges
<Badge variant="success">Active</Badge>
<Badge variant="warning">Pending</Badge>
<Badge variant="danger">Error</Badge>

// Different sizes
<Badge size="sm">Small</Badge>
<Badge size="lg">Large Badge</Badge>
```

**Features**:
- 7 semantic color variants
- 3 sizes for different contexts
- Consistent typography and spacing
- Rounded corners matching design system

### 2. Layout Components (Hybrid Approach)

These components combine Tailwind utilities with CSS Modules for complex layouts and interactions.

#### Card
**Location**: `src/ui/components/Card/Card.tsx` + `Card.module.css`

Interactive card component with elevation and hover effects.

**Props**:
```typescript
interface CardProps {
  children: React.ReactNode;
  className?: string;
  elevated?: boolean;
  interactive?: boolean;
  onClick?: () => void;
}
```

**Usage**:
```jsx
import { Card } from '@/ui/components';

// Basic card
<Card>
  <h3>Card Title</h3>
  <p>Card content goes here...</p>
</Card>

// Interactive card with elevation
<Card elevated interactive onClick={handleClick}>
  <h3>Clickable Card</h3>
  <p>This card responds to hover and click events</p>
</Card>
```

**Features**:
- Hover animations with CSS Modules
- Elevation system for depth
- Interactive states
- Flexible content layout
- Theme-aware styling

#### Grid
**Location**: `src/ui/components/Grid/Grid.tsx`

Responsive grid layout system for organizing content.

**Props**:
```typescript
interface GridProps {
  children: React.ReactNode;
  cols?: number;
  gap?: 'sm' | 'md' | 'lg';
  className?: string;
}
```

**Usage**:
```jsx
import { Grid } from '@/ui/components';

// Basic grid with default columns
<Grid cols={3} gap="md">
  <div>Item 1</div>
  <div>Item 2</div>
  <div>Item 3</div>
</Grid>

// Responsive grid
<Grid cols={2} gap="lg" className="md:grid-cols-4">
  {items.map(item => (
    <div key={item.id}>{item.content}</div>
  ))}
</Grid>
```

**Features**:
- Responsive column system
- Configurable spacing
- Flexible content arrangement
- Tailwind integration for responsiveness

#### Sidebar
**Location**: `src/ui/components/Sidebar/Sidebar.tsx` + `Sidebar.module.css`

Navigation sidebar with smooth animations and item management.

**Props**:
```typescript
interface SidebarProps {
  children: React.ReactNode;
  className?: string;
  collapsed?: boolean;
}

interface SidebarItemProps {
  icon?: React.ReactNode;
  label: string;
  active?: boolean;
  onClick?: () => void;
}
```

**Usage**:
```jsx
import { Sidebar, SidebarItem } from '@/ui/components';

<Sidebar>
  <SidebarItem 
    icon={<DashboardIcon />} 
    label="Dashboard" 
    active={currentPage === 'dashboard'}
    onClick={() => setCurrentPage('dashboard')}
  />
  <SidebarItem 
    icon={<PluginsIcon />} 
    label="Plugins" 
    onClick={() => setCurrentPage('plugins')}
  />
</Sidebar>
```

**Features**:
- Smooth collapse/expand animations
- Active state management
- Icon support for navigation items
- Responsive behavior

### 3. Navigation Components

#### AppNavigation
**Location**: `src/ui/components/AppNavigation/AppNavigation.tsx` + `AppNavigation.module.css`

Unus-inspired application navigation with sidebar layout.

**Props**:
```typescript
interface AppNavigationProps {
  currentPage: string;
  onNavigate: (page: string) => void;
  className?: string;
}
```

**Usage**:
```jsx
import { AppNavigation } from '@/ui/components';

<AppNavigation 
  currentPage={currentPage}
  onNavigate={handleNavigation}
/>
```

**Features**:
- Unus-inspired design
- Dashboard, Plugins, Settings navigation
- Smooth transitions
- Active page highlighting

### 4. Complex Components (CSS Modules-Heavy)

These components use CSS Modules extensively for complex state management and animations.

#### PluginCard
**Location**: `src/ui/components/PluginCard/PluginCard.tsx` + `PluginCard.module.css`

Advanced plugin management card with status indicators, animations, and actions.

**Props**:
```typescript
interface PluginCardProps {
  plugin: Plugin;
  onToggle: (pluginId: string) => void;
  onConfigure?: (pluginId: string) => void;
  onRemove?: (pluginId: string) => void;
  className?: string;
}

interface Plugin {
  id: string;
  name: string;
  description: string;
  version: string;
  author?: string;
  status: 'active' | 'inactive' | 'error' | 'loading';
  permissions?: string[];
  lastUpdated?: Date;
}
```

**Usage**:
```jsx
import { PluginCard } from '@/ui/components';

<PluginCard
  plugin={plugin}
  onToggle={handleToggle}
  onConfigure={handleConfigure}
  onRemove={handleRemove}
/>
```

**Features**:
- Status-based styling (active, inactive, error, loading)
- Loading animations with CSS keyframes
- Action buttons with conditional rendering
- Permission badge display
- Error state handling

#### DashboardPluginCard
**Location**: `src/ui/components/DashboardPluginCard/DashboardPluginCard.tsx`

Specialized plugin card for dashboard view with click-to-open functionality and enhanced visual feedback.

**Props**:
```typescript
interface DashboardPluginCardProps {
  plugin: PluginInfo;
  onPluginSelect: (pluginId: string) => void;
  className?: string;
}
```

**Usage**:
```jsx
import { DashboardPluginCard } from '@/ui/components';

<DashboardPluginCard
  plugin={plugin}
  onPluginSelect={handlePluginSelect}
/>
```

**Features**:
- Fully clickable cards with hand cursor for active plugins
- Hover effects with elevation and shadow animation
- Colorful plugin type icons (cyan for Simple, purple for Configured, amber for Hybrid)
- Smart interaction states (active plugins clickable, inactive/error show status)
- Visual feedback with "Click to open tool" messaging
- Plugin metadata display (version, author, type)

#### StatusBar
**Location**: `src/ui/components/StatusBar/StatusBar.tsx`

Application status bar showing plugin counts and current view context.

**Props**:
```typescript
interface StatusBarProps {
  activePlugins: number;
  totalPlugins: number;
  errorPlugins: number;
  currentView: string;
}
```

**Usage**:
```jsx
import { StatusBar } from '@/ui/components';

<StatusBar 
  activePlugins={activeCount}
  totalPlugins={totalCount}
  errorPlugins={errorCount}
  currentView="plugins"
/>
```

**Features**:
- Context-aware display (plugin counts hidden on Dashboard)
- Color-coded plugin status indicators (green/gray/red dots)
- Current view labeling
- Clean, minimal design matching application footer
- Real-time plugin status tracking
- Permission display
- Action buttons with hover effects
- Complex state management

#### SettingsForm
**Location**: `src/ui/components/SettingsForm/SettingsForm.tsx` + `SettingsForm.module.css`

Schema-driven form component with validation and change tracking.

**Props**:
```typescript
interface SettingsFormProps {
  schema: z.ZodSchema;
  initialValues?: Record<string, any>;
  onSubmit: (values: Record<string, any>) => void;
  onChange?: (values: Record<string, any>) => void;
  className?: string;
}
```

**Usage**:
```jsx
import { SettingsForm } from '@/ui/components';
import { z } from 'zod';

const schema = z.object({
  theme: z.enum(['light', 'dark']),
  notifications: z.boolean(),
  autoSave: z.boolean().default(true),
});

<SettingsForm
  schema={schema}
  initialValues={currentSettings}
  onSubmit={handleSave}
  onChange={handleChange}
/>
```

**Features**:
- Zod schema-driven form generation
- Real-time validation
- Change tracking with visual indicators
- Accessible form controls
- Error state management

### 5. Schema-Driven Components (CSS Modules-Heavy)

These components provide automatic form generation and advanced settings management using Zod schema introspection.

#### SchemaForm
**Location**: `src/ui/components/SchemaForm/SchemaForm.tsx` + `SchemaForm.module.css` + `schema-introspection.ts`

Advanced form component that automatically generates appropriate input fields from Zod schemas.

**Props**:
```typescript
interface SchemaFormProps {
  schema: z.ZodSchema;
  data: any;
  onChange: (data: any) => void;
  onSubmit?: (data: any) => void;
  className?: string;
}
```

**Usage**:
```jsx
import { SchemaForm } from '@/ui/components';
import { z } from 'zod';

const userSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  age: z.number().min(18, 'Must be at least 18'),
  preferences: z.object({
    theme: z.enum(['light', 'dark']).default('light'),
    notifications: z.boolean().default(true)
  })
});

<SchemaForm
  schema={userSchema}
  data={formData}
  onChange={setFormData}
  onSubmit={handleSubmit}
/>
```

**Features**:
- **Advanced Schema Introspection**: Parses Zod schemas to understand field types, constraints, and validation rules
- **Dynamic Field Generation**: Creates appropriate input types (text, number, boolean, select, etc.)
- **Real-time Validation**: Live validation with detailed error messages and highlighting
- **Nested Object Support**: Handles complex nested schemas with proper field organization
- **Array Field Support**: Dynamic addition/removal of array items
- **Custom Validation**: Supports all Zod validation rules including custom validators
- **Type Safety**: Full TypeScript integration with inferred types

#### AppSettings
**Location**: `src/ui/components/AppSettings/AppSettings.tsx` + `AppSettings.module.css`

Comprehensive application configuration interface with multi-section layout.

**Props**:
```typescript
interface AppSettingsProps {
  className?: string;
}
```

**Usage**:
```jsx
import { AppSettings } from '@/ui/components';

<AppSettings />
```

**Features**:
- **Multi-section Layout**: Organized into Application, Logging, and Window settings
- **Schema Integration**: Uses actual AppConfig schema for type-safe configuration
- **Live Updates**: Real-time form updates with unsaved changes tracking
- **Validation**: Complete form validation with detailed error messages
- **Success Feedback**: Clear indication of save status and changes

#### PluginSettings
**Location**: `src/ui/components/PluginSettings/PluginSettings.tsx` + `PluginSettings.module.css`

Plugin-specific configuration management with three-tier architecture support.

**Props**:
```typescript
interface PluginSettingsProps {
  pluginId: string;
  className?: string;
}
```

**Usage**:
```jsx
import { PluginSettings } from '@/ui/components';

<PluginSettings pluginId="script-runner" />
```

**Features**:
- **Three-tier Support**: Handles Simple, Configured, and Advanced plugin types
- **Dynamic Schema Generation**: Creates appropriate schemas based on plugin type
- **Plugin State Management**: Enable/disable plugins with integrated status tracking
- **Configuration Validation**: Real-time validation of plugin configurations
- **Permission Handling**: Respects plugin permissions and manifest requirements

#### SettingsPage
**Location**: `src/ui/components/SettingsPage/SettingsPage.tsx` + `SettingsPage.module.css`

Main settings interface with Unus-inspired tabbed navigation.

**Props**:
```typescript
interface SettingsPageProps {
  className?: string;
}
```

**Usage**:
```jsx
import { SettingsPage } from '@/ui/components';

<SettingsPage />
```

**Features**:
- **Tabbed Navigation**: App Settings, Plugin Settings, and System Settings tabs
- **Unus-inspired Design**: Consistent with the overall application design language
- **Responsive Layout**: Mobile-friendly with collapsible navigation
- **Integrated Settings**: Seamless integration of all settings components
- **Navigation State**: Maintains tab state and handles deep linking

## Component Library Structure

```
src/ui/components/
├── index.ts                 # Main component exports
├── Button/
│   └── Button.tsx          # Tailwind-heavy primitive
├── Input/
│   └── Input.tsx           # Tailwind-heavy primitive
├── Badge/
│   └── Badge.tsx           # Tailwind-heavy primitive
├── Card/
│   ├── Card.tsx            # Hybrid layout component
│   └── Card.module.css     # Complex hover/interaction styles
├── Grid/
│   └── Grid.tsx            # Tailwind-heavy layout
├── Sidebar/
│   ├── Sidebar.tsx         # Hybrid navigation
│   └── Sidebar.module.css  # Animation and state styles
├── AppNavigation/
│   ├── AppNavigation.tsx   # Hybrid navigation
│   └── AppNavigation.module.css # Complex animations
├── PluginCard/
│   ├── PluginCard.tsx      # CSS Modules-heavy complex
│   └── PluginCard.module.css # Advanced state management
├── SettingsForm/
│   ├── SettingsForm.tsx    # CSS Modules-heavy complex
│   └── SettingsForm.module.css # Schema-driven styling
├── SchemaForm/
│   ├── SchemaForm.tsx      # Schema-driven form generation
│   ├── SchemaForm.module.css # Form styling
│   └── schema-introspection.ts # Advanced Zod schema analysis
├── AppSettings/
│   ├── AppSettings.tsx     # App configuration interface
│   └── AppSettings.module.css # Settings styling
├── PluginSettings/
│   ├── PluginSettings.tsx  # Plugin configuration interface
│   └── PluginSettings.module.css # Plugin settings styling
└── SettingsPage/
    ├── SettingsPage.tsx    # Main settings page with tabs
    └── SettingsPage.module.css # Page styling
```

## Design System Integration

### Color System
All components use the established color palette through Tailwind utility classes and CSS custom properties:

- **Primary**: `#1555b2` (Brand Primary)
- **Action**: `#1e6de6` (Action Blue)
- **Success**: `#1da53f` (Success Green)
- **Warning**: `#eb6400` (Warning Orange)
- **Danger**: `#d31d23` (Danger Red)
- **Neutral**: `#15191e` to `#eceeee` (10 neutral shades)

### Typography
Components use consistent typography scales:
- **Headings**: `text-lg`, `text-xl`, `text-2xl`
- **Body**: `text-base`, `text-sm`
- **Weights**: `font-medium`, `font-semibold`

### Spacing
Consistent spacing using Tailwind's spacing scale:
- **Padding**: `p-2`, `p-4`, `p-6`
- **Margins**: `m-2`, `m-4`, `m-6`
- **Gaps**: `gap-2`, `gap-4`, `gap-6`

## Styling Strategy

### Hybrid Approach Implementation

1. **Tailwind-Heavy Components**: Use utilities for 90% of styling
2. **Hybrid Components**: Tailwind for layout/spacing, CSS Modules for complex behavior
3. **CSS Modules-Heavy**: Use CSS Modules for state management and animations

### CSS Modules Features

- **Component-scoped styling**: No global CSS conflicts
- **Complex animations**: Keyframes and transitions
- **State management**: Dynamic class application
- **Theme integration**: CSS custom properties

### Best Practices

1. **Start with Tailwind**: Use utilities first for rapid development
2. **Add CSS Modules**: When complex states or animations are needed
3. **Use CSS Variables**: For dynamic theming and token management
4. **Maintain consistency**: Follow established patterns across components

## Usage Examples

### Basic Component Usage
```jsx
import { Button, Card, Badge } from '@/ui/components';

function MyComponent() {
  return (
    <Card elevated>
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Feature Title</h3>
        <Badge variant="success">Active</Badge>
      </div>
      <p className="text-sm text-neutral-30 mt-2">
        Feature description goes here...
      </p>
      <div className="flex gap-2 mt-4">
        <Button variant="primary">Configure</Button>
        <Button variant="ghost">Cancel</Button>
      </div>
    </Card>
  );
}
```

### Complex Plugin Interface
```jsx
import { PluginCard, Grid, AppNavigation } from '@/ui/components';

function PluginDashboard() {
  return (
    <div className="flex h-screen">
      <AppNavigation 
        currentPage="plugins"
        onNavigate={handleNavigate}
      />
      <main className="flex-1 p-6">
        <Grid cols={2} gap="lg" className="lg:grid-cols-3">
          {plugins.map(plugin => (
            <PluginCard
              key={plugin.id}
              plugin={plugin}
              onToggle={handleToggle}
              onConfigure={handleConfigure}
            />
          ))}
        </Grid>
      </main>
    </div>
  );
}
```

### Schema-Driven Settings
```jsx
import { SettingsForm } from '@/ui/components';
import { z } from 'zod';

const settingsSchema = z.object({
  theme: z.enum(['light', 'dark']),
  notifications: z.boolean(),
  autoSave: z.boolean().default(true),
  maxFileSize: z.number().min(1).max(100),
});

function SettingsPage() {
  return (
    <div className="max-w-2xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">Application Settings</h1>
      <SettingsForm
        schema={settingsSchema}
        initialValues={currentSettings}
        onSubmit={handleSave}
        onChange={handleChange}
      />
    </div>
  );
}
```

## TypeScript Support

All components are fully typed with TypeScript:

- **Props interfaces**: Exported for external use
- **Generic support**: Where applicable (e.g., form schemas)
- **CSS Modules**: Type declarations in `src/types/css-modules.d.ts`
- **Theme types**: Consistent variant and size types

## Testing Integration

Components are designed to work with the existing Jest test suite:

- **CSS Modules**: Mocked in test environment
- **Component testing**: React Testing Library compatible
- **Accessibility**: ARIA attributes and semantic HTML
- **Responsive**: Designed to work across device sizes

## Next Steps

With the component library and schema-driven settings system complete, the next development phase focuses on:

1. **Plugin Migration**: Integrating existing plugins with the new three-tier architecture
2. **Service Registry Testing**: Validating plugin-to-plugin communication
3. **Settings Integration**: Full integration of schema-driven forms with plugin configurations
4. **Theme System**: Implementing dynamic theme switching throughout the application
5. **Component Testing**: Comprehensive test coverage for all schema-driven components
6. **Documentation**: Component stories and usage examples for the schema-driven system

## Contributing

When adding new components:

1. **Follow the hybrid styling strategy** based on component complexity
2. **Use TypeScript** for all component definitions
3. **Add CSS Modules** for complex states and animations
4. **Export types** for external consumption
5. **Document usage** with examples and prop descriptions
6. **Test thoroughly** with both light and dark themes

The component library provides a solid foundation for building the complete Omnia application and can be reused in future projects following the same design system principles.