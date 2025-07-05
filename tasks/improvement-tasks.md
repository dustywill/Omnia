- [ ] The header information is now off the top of the page. PLease bring that back. I like the height of the header, we just need to resize th content to fit.

* Clicking the Status boxes in the header still doesn't apply a filter to the Plugins page. If I click the stsus box with Errors in it, I want to.
  - Make the Pluings Page Live
  - Perform all actions that would happenn if the Issues button were pushed.

## Styling Migration Tasks

- [ ] **Migrate components from inline styles to hybrid Tailwind + CSS Modules approach**
  - Current issue: Most components use inline React styles instead of following the documented hybrid strategy
  - Components that need migration:
    - `src/ui/views/PluginsView.tsx` - heavily uses inline styles
    - `src/ui/views/SettingsView.tsx` - uses inline styles for layout
    - `src/ui/views/PluginDetailView.tsx` - uses inline styles
    - `src/ui/components/StatusBar/StatusBar.tsx` - uses inline styles
    - `src/ui/views/DashboardView.tsx` - likely uses inline styles
  
- [ ] **Follow documented styling strategy from `docs/STYLING_STRATEGY.md`:**
  - Simple utilities → Tailwind classes (`flex`, `p-4`, `text-lg`, `bg-primary`)
  - Complex component behavior → CSS Modules (`.module.css` files)
  - Design tokens → CSS custom properties for colors/spacing
  
- [ ] **Benefits of migration:**
  - Improved maintainability (centralized styles)
  - Design system consistency (use established color palette)
  - Better performance (CSS class reuse vs inline styles)
  - Easier theming support (CSS custom properties)
  - Follows project architecture guidelines
  
- [ ] **Implementation approach:**
  - Start with high-traffic components (PluginsView, DashboardView)
  - Extract common color/spacing patterns into Tailwind classes
  - Move complex state-dependent styles to CSS Modules
  - Use existing color palette: neutral-10 to neutral-95, blue-30/40, semantic colors
  - Maintain responsive design patterns

## Configuration Editor Enhancement

- [ ] **Add form/text editor toggle to SettingsForm component**
  - Current: SettingsForm only supports form-based configuration editing
  - Enhancement: Add toggle switch to switch between form view and raw JSON text editor
  - Implementation details:
    - Add toggle switch in form header (next to "Unsaved changes" badge)
    - Add large textarea that shows/hides based on toggle state
    - Add JSON parsing/stringification logic between form fields and raw text
    - Add JSON syntax validation for text mode
    - Preserve existing form validation when in form mode
    - Handle conversion between structured form data and JSON text
  - Benefits:
    - Power users can edit raw JSON when needed
    - Form mode remains user-friendly for basic configuration
    - Maintains all existing validation and change tracking
    - Provides flexibility for complex configuration scenarios

## Settings View Navigation Redesign

- [ ] **Convert Settings page to single edit view with left sidebar navigation**
  - Current: All settings (app, plugins, system info) displayed simultaneously on one scrollable page
  - Problem: Cluttered interface showing application settings alongside plugin settings
  - Solution: Implement left sidebar sub-navigation with single focused edit view
  - Navigation Structure:
    ```
    Settings Navigation (Left Sidebar)
    ├── Application Settings
    ├── Plugin Settings
    │   ├── Plugin 1
    │   ├── Plugin 2
    │   └── Plugin N
    └── System Information
    ```
  - Benefits:
    - Single focused edit view on the right
    - Clear separation between app and plugin configurations
    - Scalable for multiple plugins (better than tabs)
    - Consistent with existing app navigation UX
    - More vertical space for actual editor content
    - Hierarchical organization of related settings
  - Implementation: Replace current stacked vertical layout with sidebar navigation, each item loads specific configuration into main editor area

## Logs Screen Implementation

- [ ] **Add centralized log viewer screen for application and plugin debugging**
  - Inspiration: `inspiration/Log Console.png` - clean, functional log viewer design
  - Location: New main navigation item alongside Dashboard, Plugins, Settings
  - Left Sidebar Features:
    - **Log Level Filters**: Color-coded checkboxes for Error (red), Warning (yellow), Info (blue)
    - **Plugin Filter**: Dropdown to show "All plugins" or filter by specific plugin
    - **Action Buttons**: Export logs to file, Clear current logs
    - **Date Filter**: Optional date range picker for historical logs
  - Main Log Display:
    - **Real-time streaming**: Live log updates with "LIVE" indicator
    - **Log entry format**: Timestamp, colored log level badge, source (plugin/component), message
    - **Monospace layout**: Easy-to-read formatting for technical logs
    - **Auto-scroll**: Option to follow new logs or stay at current position
  - Benefits:
    - **Plugin debugging**: See what's happening with individual plugins
    - **System monitoring**: Track application performance and issues
    - **Development workflow**: Real-time log streaming during development
    - **Error tracking**: Quickly identify and diagnose problems
    - **Historical analysis**: Review past logs for troubleshooting
  - Implementation Notes:
    - Integrate with existing logging system in `src/core/`
    - Use WebSocket or EventSource for real-time updates
    - Store logs in memory with configurable retention limits
    - Support log export in common formats (JSON, CSV, plain text)
