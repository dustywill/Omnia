# Omnia
This will be an evolution of the ttComander application

The project runs entirely in a standard Node environment using an Express server.
The server exposes a simple file system API:

- `GET /api/read?path=FILE`
- `POST /api/write?path=FILE` with `{ data: string }`
- `GET /api/readdir?path=DIR&withFileTypes=true`
- `POST /api/mkdir?path=DIR` with `{ options?: object }`

## Contributing

- Follow Test-Driven Development for all changes.
- When adding a new feature:
  1. Write a failing test that demonstrates the desired behavior and commit it.
  2. Implement the code required to make the test pass and commit that change separately.
- Run `npm test` to ensure all tests pass before pushing.

## Development

1. Install dependencies with `npm install`.
2. Start the app in development mode using `npm run dev`.
3. Build the project with `npm run build`.
4. Run the compiled app using `npm start` which launches the Express server and opens the app in your browser.
