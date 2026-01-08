# FinTrack Frontend

Angular frontend for FinTrack application.

## Before Deployment

Update `src/environments/environment.prod.ts` with your backend URL:

```typescript
export const environment = {
  production: true,
  apiUrl: "https://your-backend-url.vercel.app/api",
};
```

## Deploy to Vercel

1. Update backend URL in environment.prod.ts
2. Push this folder to GitHub
3. Go to [Vercel](https://vercel.com)
4. Import the repository
5. Deploy!

## Local Development

```bash
npm install
ng serve
```

App will be available at: http://localhost:4200
