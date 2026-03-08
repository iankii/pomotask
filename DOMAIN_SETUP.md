Domain setup and Firebase Hosting checklist for `pomotask.co`

Overview
- You purchased `pomotask.co`. This document shows the exact steps to connect it to Firebase Hosting, verify ownership, add the necessary DNS records, and enable GitHub-based CI deploys (we already added a GitHub Action).

Recommended host setup
- Prefer hosting the app on a subdomain such as `app.pomotask.co` (recommended) so you can keep marketing/landing pages on the apex `pomotask.co` if needed.

1) Create / link Firebase project
- Go to https://console.firebase.google.com/
- Create a new project or select an existing one.
- Choose a project id (we used a placeholder in `.firebaserc`): `pomotask-ankit` — replace this with your actual project id or update `.firebaserc` after creating the project.

2) Add the custom domain in Firebase Hosting
- Console → Hosting → Add custom domain
- Enter the domain you want to use: `app.pomotask.co` (or `pomotask.co` if you prefer apex)
- Firebase will show a TXT verification record. Copy that value.

3) Add verification TXT record at your DNS provider
- Log into your registrar/DNS provider (Namecheap, Cloudflare, Google Domains, etc.).
- Create a new DNS TXT record. Example (values will come from Firebase console):
  - Host / Name: `firebase` or `@` (follow provider instructions) — Firebase gives exact name
  - Type: `TXT`
  - Value: (Firebase-provided TXT string)
- Save DNS record and wait for propagation (can take a few minutes to hours). Firebase console will show verification progress.

4) Add A (or ALIAS) records after verification
- After Firebase verifies, it will provide the A records (IPv4 addresses) to point the domain at Firebase Hosting. Add those A records at your DNS provider.
- Example A records (these are example placeholders — use the actual values Firebase gives you):
  - `@` → `199.36.158.100`
  - `@` → `199.36.158.101`
- For subdomains (`app.pomotask.co`) add an A record for `app` pointing to the Firebase Hosting addresses, or create a CNAME if your provider supports it as instructed by Firebase.
- Wait for DNS propagation; Firebase will automatically provision SSL once DNS is correct.

5) Add Authorized Domain for Firebase Auth (if you plan to use Auth)
- Console → Authentication → Settings → Authorized domains
- Add:
  - `app.pomotask.co` (or `pomotask.co` if using apex)
  - And keep the default `PROJECT_ID.web.app` / `PROJECT_ID.firebaseapp.com`

6) GitHub Actions / CI deploy
- We already added `.github/workflows/firebase-deploy.yml` which runs on push to `main` and deploys `task-pomodoro` directory.
- Generate a CI token locally and add to GitHub secrets:
  1. Install Firebase CLI locally (if not already): `npm install -g firebase-tools`
  2. Login and create token: `firebase login:ci` → copy token output
  3. Go to your GitHub repo → Settings → Secrets → Actions → New repository secret
     - Name: `FIREBASE_TOKEN`
     - Value: (the token string)
- When you push to `main`, the workflow will build the app and run `firebase deploy --only hosting`.

7) Local preview (optional)
- Build locally and preview:
  ```bash
  cd /Users/ankitpal/Dev/task-pomodoro
  npm ci
  npm run build
  npx serve dist
  # or use firebase CLI preview (requires firebase project link):
  firebase hosting:preview --project <YOUR_PROJECT_ID>
  ```

8) Update `.firebaserc` (important)
- Replace the `default` project id in `task-pomodoro/.firebaserc` with your real Firebase project id if it differs from `pomotask-ankit`.

9) Optional: SSL / caching / headers
- Firebase will provision SSL automatically. For caching headers or custom redirects add them in `firebase.json`.

10) Domain fallback & marketing
- If you want `pomotask.co` (apex) to serve marketing pages and `app.pomotask.co` to serve the app, set hosting channels appropriately (you can set multiple sites within the same Firebase project). Ask me and I can scaffold multi-site config if you want this separation.

Troubleshooting
- If verification fails: double-check the TXT value and ensure there are no extra quotes or whitespace. Use `dig txt yourdomain` to confirm your TXT record.
- If SSL is pending: ensure A records match what Firebase expects and wait (often 5–30 mins, sometimes longer due to DNS caches).

If you want, I can:
- Replace the placeholder in `.firebaserc` with your actual Firebase project id now (you can share it), or
- Walk through the Firebase Console steps with you, or
- Prepare the exact DNS entries to paste into your registrar (I can do this after you start the Add Domain flow because Firebase gives the values dynamically).

