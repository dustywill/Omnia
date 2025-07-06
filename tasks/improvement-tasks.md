# screenshot\Omnia - Dashboard 070525 1846.jpg

- The two Omni logos and headers in the top right corner seems redundant. I htinkn we can remove the entire top one.
- Let's use the blue background for he Dashboard head section's background
  - Make sure the text is in a contrasting enough color to be seen.
- The Active, Inactive, Errors, and Total squares shjould navigate to the Plugins page AND Enable the Active, Inactive or Issues (Errors) filter
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

# Questions

- What is the remove button on the plugins cards supposed to do? Would lat delete th plugin? If not how is it different from the disable?
