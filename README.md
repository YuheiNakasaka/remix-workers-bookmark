# Bookmark App with Remix + Cloudflare Stacks

- Remix
  - React
  - TypeScript
  - Tailwind CSS
  - Drizzle ORM, Drizzle Kit
  - zod
  - remix-auth
  - remix-auth-google
  - remix-validated-form
- Cloudflare Workers
- KV
- D1
- Queue
- R2
- Cron Triggers

## Structures

- `app/routes`
  - Place route pages associated with the URL.
  - Place the `route.tsx` file in the Routing Path directory according to the pattern of [Folders for Organization](https://remix.run/docs/en/main/file-conventions/route-files-v2#folders-for-organization).
  - Place components and other items used **only** on that page within the directory.
- `app/features`
  - Place components, functions, etc., that are used across components.
  - Create directories like `app/features/feature-name` and arrange files in hierarchies like `components` or `services`.
- `app/db`
  - Place database schema files and migration files.

## Development

### Migration

```sh
npm run migrations:gen
```

```sh
npm run local:migrations:apply
```

### Start server

```sh
npm run dev
```

Open up [http://127.0.0.1:8788](http://127.0.0.1:8788) and you should be ready to go!

## Deployment

### Deploy

Push to GitHub and manually trigger a deployment with workflow_dispatch event from Actions > All workeflows.

# License

MIT
