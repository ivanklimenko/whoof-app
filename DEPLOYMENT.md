# Whoof web preview

Public app: https://whoof-app.vercel.app
Vercel project: `whoof-1083/whoof-app`
Dashboard: https://vercel.com/whoof-1083/whoof-app

Published 25 September 2026 from this `design v1` folder. Native web version, without a phone mockup.

Updated 28 September 2026 with movement/sleep metrics, recognised food/water events, and the current authentication and friendship prototype flows. Deployment: `dpl_5pm3NxJPhb6JgCXT1HGFy9qCkFB2` (production alias unchanged).

Latest update: authentication temporarily disabled at the user's request. Visitors enter Home immediately; Settings has no account/logout section. Deployment: `dpl_CLt4bNw7amhExrAgoD9Mt5v6Wqsg`, same public URL.

To publish later changes from this directory with the authorized Vercel account:

```sh
npx --yes vercel@latest deploy --prod --yes --scope whoof-1083
```

Vercel runs `npm run build` and serves only `dist/client` as configured in `vercel.json`. `.vercel/project.json` links this local folder to the project; it is ignored by Git. Never commit or share `.env.local` or authentication credentials. `.vercelignore` excludes local environment files, QA artifacts and dependency folders from uploads.

Task progress and medical documents remain local to each browser. Hosting does not add shared accounts, a database or cross-device synchronization. Public preview storage is separate from localhost storage.
