# Omnia
This will be an evolution of the ttComander application

The project runs entirely in a standard Node environment using an Express
server. The server runs on port `3000` by default and exposes a simple file
system API:

- `GET /api/read?path=FILE`
- `POST /api/write?path=FILE` with `{ data: string }`
- `GET /api/readdir?path=DIR&withFileTypes=true`
- `POST /api/mkdir?path=DIR` with `{ options?: object }`

## Plugins

Plugins are React components located in the `plugins/` directory. Each plugin is
compiled to JavaScript as part of the build process and loaded at runtime from
`dist/plugins/<plugin-id>/index.js`. The helpers in
`src/ui/node-module-loader.ts` allow these browser based plugins to read and
write files through the Express server's API endpoints.

## Contributing

- Follow Test-Driven Development for all changes.
- When adding a new feature:
  1. Write a failing test that demonstrates the desired behavior and commit it.
  2. Implement the code required to make the test pass and commit that change separately.
- Run `npm test` to ensure all tests pass before pushing.

## Development

1. Install dependencies with `npm install`.
2. Start the app in development mode using `npm run dev`.
3. Build the project with `npm run build`. This compiles the server and all plugins to the `dist/` directory.
4. Run the compiled app using `npm start`. This launches the Express server and automatically opens `http://localhost:3000` in your default browser.
