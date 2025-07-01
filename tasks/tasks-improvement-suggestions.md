## Relevant Files

- `src/ui/components/MercurialCommit.ts` - Handles Mercurial commit execution.
- `plugins/script-runner/index.ts` - Discovers and runs PowerShell scripts; manages output.
- `src/core/event-bus.ts` - Simple publish/subscribe implementation.
- `src/ui/json-editor-api.tsx` - Opens the JSON editor component with file contents.
- `src/core/plugin-manager.ts` - Loads plugin manifests and modules.
- `plugins/customer-links/index.tsx` - Generates HTML for customer site links.
- `src/core/crawler.js` - Recursively crawls directories in parallel.
- `src/core/logger.ts` - Current logging utility.
- `src/core/utility.ts` - Path utilities including `sanitizeAbsolutePath`.
- `README.md` - Project documentation.
- `tests/**/*` - Existing test suites for these modules.

### Notes

- Place tests next to the files they cover (e.g., `MercurialCommit.test.ts` alongside `MercurialCommit.ts`).
- Run `npx jest` to execute the entire test suite.

## Tasks

- [ ] 1.0 Expand Documentation
  - [ ] 1.1 Document configuration paths and environment variables in `README.md`.
  - [ ] 1.2 Document the expected plugin module interface and lifecycle hooks.
- [ ] 2.0 Increase Test Coverage
  - [ ] 2.1 Add tests for plugin load failures and error logging behavior.
  - [ ] 2.2 Add tests for commit errors in `MercurialCommit`.
  - [ ] 2.3 Add tests for missing-file errors in `openJsonEditor`.
  - [ ] 2.4 Add tests verifying sanitized script paths prevent unintended execution.
- [ ] 3.0 Improve Error Handling and Logging
  - [ ] 3.1 Wrap event bus handler calls in `try/catch` and log errors.
  - [ ] 3.2 Handle file read failures in `openJsonEditor` and surface meaningful messages.
  - [ ] 3.3 Integrate `pino` into `createLogger` for structured logging.
- [ ] 4.0 Secure Generated Output
  - [ ] 4.1 Escape site names and URLs in `generateCustomerLinksHtml` to avoid injection.
  - [ ] 4.2 Stream large script output to a temporary file in `createOutputManager`.
- [ ] 5.0 Optimize Plugin Management
  - [ ] 5.1 Load plugin manifests and modules in parallel using `Promise.all`.
  - [ ] 5.2 Define a shared TypeScript interface for plugin modules (`init` and `stop`).
  - [ ] 5.3 Validate plugin configuration defaults on load.
- [ ] 6.0 Add Crawler Concurrency Controls
  - [ ] 6.1 Expose a `concurrency` option in `crawlDirectory` and limit parallel operations.
  - [ ] 6.2 Provide a default concurrency value via configuration.
- [ ] 7.0 Harden External Process Execution
  - [ ] 7.1 Replace `exec` in `MercurialCommit` with `spawn` or `execFile` using argument arrays.
  - [ ] 7.2 Sanitize script paths in `runScript` via `sanitizeAbsolutePath`.
  - [ ] 7.3 Validate commit messages and file paths to prevent injection.
