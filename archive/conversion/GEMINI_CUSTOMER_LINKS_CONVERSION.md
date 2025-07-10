# Plan: Convert Customer Links Plugin to Shadcn UI

**Document Version:** 2.0
**Date:** 2025-07-08

## 1. Executive Summary & Goal

**Update:** Initial investigation has confirmed that the core Omnia application is already configured to use Tailwind CSS v4 and its build process scans all plugin directories. This significantly simplifies the project.

The objective is to refactor the Customer Links plugin to use the Shadcn UI component library, leveraging the existing Tailwind CSS infrastructure. This will replace the plugin's current custom React components and styling. The goal is to create a more modern, professional, and maintainable UI, both for the plugin's interface within Omnia and for the static HTML page it generates.

The project is now divided into two main phases:

1.  **Phase 1: Plugin UI Refactor.** Rebuild the plugin's user interface using Shadcn UI components.
2.  **Phase 2: Static Page Generator Update.** Modify the HTML generation logic to produce a self-contained, Tailwind-styled static page.

## 2. Prerequisites

-   Node.js and `npx` must be available in the development environment to run the Shadcn UI CLI commands.
-   The core Omnia application's existing Tailwind CSS v4 configuration is the foundation for this plan.

---

## 3. Phase 1: Plugin UI Refactor (Shadcn UI Implementation)

**Objective:** Replace the existing UI of the Customer Links plugin with components from the Shadcn UI library.

**Task 3.1: Initialize Shadcn UI in Omnia Project**
*   **Action:** Run the Shadcn UI initialization command from the root of the Omnia project: `npx shadcn-ui@latest init`.
*   **Details:** This is a one-time setup for the entire project. It will create a `components.json` file and utility files (e.g., `src/lib/utils.ts`), configuring where the component source code will be placed.

**Task 3.2: Add Required Components to the Project**
*   **Action:** Use the Shadcn UI CLI to add the source code for the specific components we will need.
*   **Details:** The command will be: `npx shadcn-ui@latest add card button tabs accordion`. This will copy the React and TypeScript source code for these components into a new `src/ui/components/ui` directory, making them a part of the Omnia project that any plugin can use.

**Task 3.3: Refactor the Plugin's `index.tsx`**
*   **Action:** Modify the file `plugins/customer-links/index.tsx`.
*   **Details:**
    1.  **Remove Old Styles:** Delete the import and all usages of the existing CSS module file and any inline `style` objects.
    2.  **Import Shadcn Components:** Import the newly added `Card`, `Button`, `Tabs`, and `Accordion` components from their new location in `src/ui/components/ui`.
    3.  **Rebuild the Layout:**
        *   Replace the current tab-switching logic with the `<Tabs>` component for a cleaner navigation between "Preview," "Edit Data," and "Generate HTML."
        *   In the "Preview" tab, replace the custom customer card grid with the `<Accordion>` component. Each customer will be an `<AccordionItem>`. The customer's name will be the `<AccordionTrigger>`, and the list of their sites will be the `<AccordionContent>`. This provides a better user experience than the previous custom collapsible logic.
        *   Use the `<Card>` and `<Button>` components where appropriate for a consistent look and feel.
    4.  **Apply Tailwind Classes:** Replace all existing `className` attributes with the appropriate Tailwind utility classes for all layout, color, spacing, and typography needs.

---

## 4. Phase 2: Static Page Generator Update

**Objective:** Update the HTML generation feature to produce a single, self-contained `.html` file that is correctly styled with the new Tailwind CSS classes.

**This is the most complex phase and requires a multi-step generation process.**

**Task 4.1: Update the HTML Template Function**
*   **Action:** Modify the `generateCustomerSitesHtml` function in `plugins/customer-links/index.tsx`.
*   **Details:** The function will be updated to generate an HTML string that uses the new DOM structure (based on the Accordion and Card components) and includes the necessary Tailwind utility classes.

**Task 4.2: Implement a New Generation Pipeline**
*   **Action:** The `handleGenerateHtml` function will be rewritten to perform a sequence of operations.
*   **Details:**
    1.  **Step A (Generate Raw HTML):** The function will first call `generateCustomerSitesHtml` and save its output to a temporary file (e.g., `temp/customers-raw.html`).
    2.  **Step B (Invoke Tailwind CLI):** The function will then programmatically execute the Tailwind CLI as a shell command, leveraging the project's root `tailwind.config.js`. This command will scan the raw HTML file and generate an optimized, minimal CSS file containing only the required styles. The command will look like: `npx tailwindcss -o ./temp/final-styles.css --content ./temp/customers-raw.html`.
    3.  **Step C (Read Generated CSS):** The function will read the entire content of the generated `temp/final-styles.css` file into a string variable.
    4.  **Step D (Inject and Save):** Finally, the function will take the original HTML template, inject the generated CSS string into the main `<style>` tag, and save the result to the final destination path specified in the plugin's configuration.

**Task 4.3: Acknowledge Limitations**
*   **Context:** The generated static HTML page will be visually identical to the plugin's UI, but it will not be a running React application.
*   **Outcome:** This means that any JavaScript-based interactivity from the Shadcn UI components (like the smooth open/close animation of the Accordion) will be lost. The generated page will be correctly styled but functionally static. This is an inherent and acceptable trade-off for producing a dependency-free static file.

This revised plan is more accurate and provides a clear path to modernizing the Customer Links plugin.