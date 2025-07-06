# All Screens

- Change the top left div to be this for the image. Get rid of the second Omnia and the "PLugin Management..."

```HTML
<div style="padding: 5px; border-bottom: 1px solid rgb(229, 231, 235); text-align: center; display: flex; flex-direction: column; align-items: center; gap: 12px;"><div style="width: 100%; display: flex; align-items: center; justify-content: center;"><img alt="Omnia Logo" src="./assets/omnia_logo.svg" style="width: 100%;"></div></div>
```

- Let's use the blue background for the Dashboard head section's background
  - Make sure the text is in a contrasting enough color to be seen.

# screenshot\Omnia - Dashboard 070525 1846.jpg

- The Active, Inactive, Errors, and Total squares should navigate to the Plugins page AND Enable the Active, Inactive or Issues (Errors) filter
- Remove the indicator for active on the cards, only active Plugins should show on the Dashboard.
- When the window is not able to display all of the contents vertically, the scroll bar bottom down button is hidden by the status bar.

# screenshot\Omnia - Plugins 070525 1847.jpg

- this page should use the same card grid that the dashboard does.
- The control buttons above the cards should be srpead out some.
  - Add Plugin in the top right
  - Search Plugins on th etop left and the filter button s in the middle
- Change the Active indicator into a iOS style switch control that shows green when active and red when inactive.
  - This means we can remove the deactivate button from the cards

# screenshot\Omnia - Logs 070525 1849.jpg

- The logs page still is not getting the same main style as the others because the navigation page and main page go up when it gets launched.

# screenshot\Omnia - Settings - App Settings 070525 1848.jpg

- Rename the sub navigation that says Plugin Management to PLugin Settings
  - UNder this show each of the plugins by name
  - Clicking on the plugin name should populate the main portion with that plugin's settings.

# screenshot\Omnia - Settings - Demo Settings 070525 1848.jpg

- This is not loading properly

# Settings - System Information

- This does not display
- Console log

```
Uncaught ReferenceError: process is not defined
    at renderMainContent (SettingsView.js:304:105)
    at SettingsView (SettingsView.js:415:76)
```

🔧 Remaining Issues to Fix

1. SettingsView Auto-Opening Loop

Priority: HighIssue: SettingsView continuously auto-opens plugin configuration, causing excessive logging and poor UX

Tasks:

- Investigate src/ui/views/SettingsView.tsx for auto-opening logic
- Look for useEffect hooks or timers that might be triggering repeated navigation
- Check navigation state management to prevent infinite loops
- Add guards to prevent auto-opening from triggering multiple times
- Test navigation flow to ensure one-time auto-opening behavior

2. Excessive JSON5 Module Loading

Priority: MediumIssue: JSON5 module is loaded repeatedly for the same operations, causing performance overhead

Tasks:

- Implement module caching in src/ui/node-module-loader.ts
- Add singleton pattern for loaded modules to prevent re-loading
- Cache module instances per session to reduce IPC calls
- Add debug logging to track module reuse vs. fresh loads
- Test performance improvement with module caching

3. Zod Schema Loading Error

Priority: MediumIssue: z.array(...).default is not a function error in demo schema initialization

Tasks:

- Fix Zod schema usage in SettingsView demo schema
- Update schema definitions to use correct Zod syntax
- Ensure compatibility with current Zod version
- Add error handling for schema initialization failures
- Test schema validation with proper Zod patterns

4. Optimize Logging Verbosity

Priority: LowIssue: Too many INFO-level logs for normal operations, cluttering the log output

Tasks:

- Review log levels for routine operations (file reads, module loading)
- Change routine operations from INFO to DEBUG level
- Keep ERROR and WARN levels for actual issues
- Add configuration option to control log verbosity
- Update LogsView to default to ERROR/WARN only for cleaner display

5. Navigation State Management

Priority: LowIssue: Navigation events might not be properly managed, causing repeated operations

Tasks:

- Review src/core/navigation-service.ts for state management issues
- Add debouncing for rapid navigation events
- Implement proper cleanup for navigation listeners
- Add navigation history management to prevent back/forward loops
- Test navigation flow stability

📋 Priority Order for Implementation:

1. Fix SettingsView auto-opening loop (High - affects UX and log clarity)
2. Implement module caching (Medium - performance improvement)
3. Fix Zod schema error (Medium - eliminates error messages)
4. Optimize logging verbosity (Low - improves log readability)
5. Review navigation state management (Low - system stability)

These tasks will complete the logging system optimization and resolve the application behavior issues that are causing excessive log entries.

# Questions

- What is the remove button on the plugins cards supposed to do? Would lat delete th plugin? If not how is it different from the disable?
