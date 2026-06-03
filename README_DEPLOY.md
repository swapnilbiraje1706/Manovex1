# Manovex Final GitHub Deployment Package

This folder is prepared for a fresh GitHub repository and Netlify deployment.

## Required Directory Structure

Upload the contents of this folder to the root of your GitHub repository. The repository must look like this:

```text
.env.example
.gitignore
index.html
features.html
netlify.toml
package.json
README_DEPLOY.md
robots.txt
sitemap.xml

blog/
  blog.css
  index.html
  best-speed-reading-app.html
  rsvp-reader-explained.html
  pdf-speed-reader.html
  reading-speed-test-wpm.html
  speed-reading-for-students.html
  read-faster-with-comprehension.html
  dyslexia-friendly-reader.html
  focus-music-for-reading.html
  epub-speed-reader.html
  article-speed-reader.html

features/
  feature-05-web-article-import.js
  feature-06-adaptive-training-plans.js
  feature-07-ai-comprehension-quizzes.js
  feature-08-dyslexia-friendly-font.js
  feature-09-reading-brain-type-quiz.js
  feature-10-streak-gamification.js

netlify/
  edge-functions/
    inject-env.js
  functions/
    create-order.js
    verify-payment.js

supabase/
  migrations/
    20260423_pricing_and_subscriptions.sql
```

Do not upload:

- `.env`
- `node_modules/`
- `.netlify/`
- a root-level `inject-env.js`
- a root-level `create-order.js`
- a root-level `verify-payment.js`

In `index.html`, Supabase and Razorpay public values intentionally stay as placeholders. Netlify injects the real values at runtime:

```js
const SUPABASE_PROJECT_URL = "/__SUPABASE_URL__/";
const SUPABASE_ANON = "/__SUPABASE_KEY__/";
const RAZORPAY_KEY_ID = "/__RAZORPAY_KEY_ID__/";
```

## Netlify Settings

Use these deploy settings:

- Branch: `main`
- Build command: leave empty
- Publish directory: `.`

The Netlify functions are configured in `netlify.toml`.

There is no build command and no required npm dependency. The Razorpay backend uses Razorpay's HTTPS API directly through Netlify Functions.

Set `manovex.in` as the primary production domain in Netlify. Keep `www.manovex.in` and the Netlify subdomain on the same site so the redirects in `netlify.toml` can send them to `https://manovex.in`.

## Netlify Environment Variables

Add these in Netlify Site settings:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `SUPABASE_URL`
- `SUPABASE_PUB_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`

For test checkout, use Razorpay test keys. For real subscribers, replace them with Razorpay live keys after KYC approval.

## Final Domain Settings

After `manovex.in` is connected to the new Netlify site, use these production values in external dashboards.

Supabase Authentication URL Configuration:

- Site URL: `https://manovex.in`
- Redirect URL: `https://manovex.in`
- Redirect URL: `https://manovex.in/**`
- Redirect URL: `https://www.manovex.in`
- Redirect URL: `https://www.manovex.in/**`

Google OAuth client:

- Authorized JavaScript origin: `https://manovex.in`
- Authorized JavaScript origin: `https://www.manovex.in`
- Authorized redirect URI: `https://YOUR_SUPABASE_PROJECT.supabase.co/auth/v1/callback`

For this current Supabase project, the callback is:

```text
https://thaiteyodtmkklleelyv.supabase.co/auth/v1/callback
```

Razorpay website/liveness URL:

```text
https://manovex.in
```

## After Deploy

Check these URLs:

- `https://manovex.in`
- `https://www.manovex.in`
- your Netlify subdomain, which should redirect to `https://manovex.in`
- `https://manovex.in/.netlify/functions/create-order`

The function URL should not show a Netlify 404 page. `Method not allowed` is acceptable when opened directly in the browser because the function expects a POST request.

Check the live page source for this text:

`Use every paid feature from here`

If that text exists, the latest Manovex version is deployed.
