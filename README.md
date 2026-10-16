# Pispot — Indonesia Toilet Map

A mobile-friendly React prototype for discovering and reviewing toilet stops across Indonesia.

## Run locally

```sh
npm install
npm run dev
```

Create a production build with `npm run build`.

## Publish a free public demo

This project is configured for Netlify. To publish without Git:

1. Run `npm run build`.
2. Sign in to Netlify and create a site using its manual deploy / drag-and-drop option.
3. Upload the generated `dist` folder. Netlify will provide a public `*.netlify.app` URL.
4. To publish changes later, build again and upload the new `dist` folder to the same site.

For automatic deployments from GitHub, import this project into Netlify instead; the included `netlify.toml` sets the build command and publish directory.

## Connect shared community data with Supabase

The app can use a Supabase project to share toilet listings and reviews across visitors:

1. Create a free Supabase project.
2. In its SQL Editor, run [`supabase/schema.sql`](./supabase/schema.sql). This creates the tables, public read/submit row-level security policies, and four clearly unverified demonstration locations.
3. Copy `.env.example` to `.env.local` and fill in the project URL and anon/publishable key from **Project Settings → API**. The public browser key is expected to be visible in the built app; never use a `service_role` or secret key here.
4. Run `npm run dev` to test. For Git-connected Netlify, add `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in the site's environment variables, then trigger a new deploy. For manual drag-and-drop deploys, build locally with `.env.local` configured and upload the refreshed `dist` folder. Vite includes these values at build time.

Without these environment variables, Pispot stays in its local demo mode and saves changes in the current browser only. In Supabase mode, listings and reviews are public, and submissions do not require an account. The database validates fields and prevents public edits/deletions or self-verification, but anonymous posting can still be abused; add sign-in, CAPTCHA/rate limiting, and moderation before promoting it widely.

Existing listings saved in a browser's local storage are not uploaded automatically; add them again after connecting Supabase if you want them in shared data.

## Prototype features

- Explore sample toilet spots on an OpenStreetMap-powered map.
- Switch between neutral light and dark themes with green text accents; the choice is saved in the browser.
- Keep map tiles and toilet photos in their original colour in both themes.
- Search by place, neighbourhood, city, or province.
- Filter for free, accessible, and highly rated spots; sort by rating.
- Use browser location to select the closest listed spot.
- Add a toilet listing and post a star-rated review.
- Save listings and reviews in browser local storage when Supabase is not configured.

The local sample spots and reviews are demonstration content. Supabase setup seeds four unverified sample locations without reviews. Map tiles are provided by OpenStreetMap; review its tile usage policy before deploying at scale.
