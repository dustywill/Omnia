// LEGACY: Original Omnia Components (Default exports for backward compatibility)
// These remain as the default exports to ensure existing plugins continue to work
export { Button } from './Button/Button.js';
export type { ButtonProps } from './Button/Button.js';

export { Input } from './Input/Input.js';
export type { InputProps } from './Input/Input.js';

export { Badge } from './Badge/Badge.js';
export type { BadgeProps } from './Badge/Badge.js';

// NEW: Shadcn UI Components (Use these for new development)
export { Button as ShadcnButton } from './ui/button.js';
export type { ButtonProps as ShadcnButtonProps } from './ui/button.js';

export { Input as ShadcnInput } from './ui/input.js'; 
export type { InputProps as ShadcnInputProps } from './ui/input.js';

export { Badge as ShadcnBadge } from './ui/badge.js';
export type { BadgeProps as ShadcnBadgeProps } from './ui/badge.js';

// Shadcn Demo Component for Testing
export { ShadcnDemo } from './ui/demo.js';
export type { ShadcnDemoProps } from './ui/demo.js';

export { ToggleSwitch } from './ToggleSwitch/ToggleSwitch.js';
export type { ToggleSwitchProps } from './ToggleSwitch/ToggleSwitch.js';

// Layout Components
export { Card } from './Card/Card.js';
export type { CardProps } from './Card/Card.js';

export { Grid } from './Grid/Grid.js';
export type { GridProps } from './Grid/Grid.js';

export { Sidebar, SidebarItem } from './Sidebar/Sidebar.js';
export type { SidebarProps, SidebarItemProps } from './Sidebar/Sidebar.js';

// Navigation Components
export { AppNavigation } from './AppNavigation/AppNavigation.js';
export type { AppNavigationProps } from './AppNavigation/AppNavigation.js';

export { AppHeader } from './AppHeader/AppHeader.js';
export type { AppHeaderProps } from './AppHeader/AppHeader.js';

// Complex Components
export { PluginCard } from './PluginCard/PluginCard.js';
export type { PluginCardProps, Plugin } from './PluginCard/PluginCard.js';

export { SettingsForm } from './SettingsForm/SettingsForm.js';
export type { SettingsFormProps, SettingsField } from './SettingsForm/SettingsForm.js';

// Schema-Driven Components
export { SchemaForm } from './SchemaForm/SchemaForm.js';
export type { SchemaFormProps, SchemaFormField } from './SchemaForm/SchemaForm.js';

export { AppSettings } from './AppSettings/AppSettings.js';
export type { AppSettingsProps } from './AppSettings/AppSettings.js';

export { PluginSettings } from './PluginSettings/PluginSettings.js';
export type { PluginSettingsProps } from './PluginSettings/PluginSettings.js';

export { SettingsPage } from './SettingsPage/SettingsPage.js';
export type { SettingsPageProps } from './SettingsPage/SettingsPage.js';

// JSON Editor Component
export { JsonEditor } from './JsonEditor/JsonEditor.js';
export type { JsonEditorProps } from './JsonEditor/JsonEditor.js';

// Notification System
export { NotificationSystem, useNotifications } from './NotificationSystem/NotificationSystem.js';
export type { NotificationSystemProps, Notification, NotificationType } from './NotificationSystem/NotificationSystem.js';

// File Tree Component
export { FileTree } from './FileTree/FileTree.js';
export type { FileTreeProps, FileTreeNode } from './FileTree/FileTree.js';