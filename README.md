# Five-a-side

JavaScript React app (Vite). The homepage is the current week’s fixtures, using last year’s 23 March slot layout and colours.

## Run

```bash
npm install
npm run dev
```

The board works from local JavaScript seed data until Firebase is connected.

## Firebase

1. Create a Firestore project.
2. Copy `.env.example` to `.env.local` and fill in the Vite keys.
3. Deploy rules: `npx firebase deploy --only firestore:rules`
4. Temporarily allow writes, run `npm run seed`, then lock writes again.

Collections: `weeks`, `fixtures`.
