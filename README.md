# Brain Dominance Test - Bootleg

A web version of Bootleg's Whole-Brain Thinking Profile, styled in the Bootleg brand
system (black / gray #C8C8C8 / orange #FB5000, dark editorial theme). Participants answer
36 preference statements and 24 forced-choice pairs, then instantly see their profile
(Primary / Secondary / Tertiary / Fourth quadrant) with a radar chart. Everything runs in
the browser - no data leaves the device - and results can be saved via Download / Print (PDF).

## Thinking styles
- Analyst (A) - logical / analytical
- Builder (B) - organized / sequential
- Connector (C) - interpersonal / feeling
- Dreamer (D) - holistic / creative

## Files
| File | Purpose |
|------|---------|
| `index.html` | Page structure |
| `styles.css` | Bootleg-branded dark styling |
| `data.js` | Questions, quadrant info, icons, scoring weights |
| `app.js` | Rendering, scoring, results, PDF |
| `logo-mark.svg` | Bootleg "B" symbol (recreated as vector) |
| `favicon.svg` | Browser tab icon |
| `vercel.json` | Static hosting config |

## Brand notes
- Colors match the Bootleg Brand Guidelines: black, gray `#C8C8C8`, orange `#FB5000`.
- Type: headings/UI use **General Sans** (Fontshare, free) and labels use **IBM Plex Mono**
  (Google Fonts, the exact brand supporting typeface). General Sans is the closest free
  match to **PP Telegraf** (the brand primary, a licensed font). `--sans` in `styles.css`
  lists `'PP Telegraf'` first, so if you later add the licensed PP Telegraf `.woff2` files
  to `fonts/`, the site upgrades to it automatically with no other changes.
- `logo-mark.svg` is a faithful vector rebuild of the B symbol. If you'd rather use the
  official artwork, drop in the real SVG/PNG and update the `src` in `index.html`.

## Customize
- Questions / wording: `data.js`
- Scoring weight (Likert vs Forced-Choice): `WEIGHTS` at the bottom of `data.js` (sum to 1)

## Deploy to Vercel
1. Push this folder to a new GitHub repo:
   ```bash
   cd brain-dominance-site
   git init && git add . && git commit -m "Brain Dominance Test"
   git branch -M main
   git remote add origin https://github.com/<you>/<repo>.git
   git push -u origin main
   ```
2. Vercel: Add New > Project > Import the repo. Framework Preset: Other. Deploy.
3. Push to `main` anytime to redeploy.

## Run locally
Open `index.html`, or:
```bash
python3 -m http.server 8000    # visit http://localhost:8000
```

## Optional: save results to a Google Sheet

By default nothing leaves the participant's browser. To collect every submission in a
Google Sheet (useful after a workshop), set up a free Google Apps Script web app:

1. Create a new Google Sheet (this is where responses land).
2. In the Sheet: **Extensions > Apps Script**. Delete any starter code, paste the entire
   contents of `google-apps-script.gs`, and click **Save**.
3. **Deploy > New deployment**. Select type **Web app**.
   - Description: anything (e.g. "Brain Dominance Test").
   - Execute as: **Me**.
   - Who has access: **Anyone**.
   - Click **Deploy**, authorize when prompted, and copy the **Web app URL**
     (it ends in `/exec`).
4. Open `data.js` and paste that URL into `SHEET_ENDPOINT`:
   ```js
   const SHEET_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
   ```
5. Redeploy the site (push to `main`). Take the test once to confirm a row appears on the
   **Responses** tab.

Notes
- Each submission adds one row: timestamp, participant details, the four quadrant scores
  (Likert / Forced-Choice / Combined), the ranked preferences, and the raw answers as JSON.
- When `SHEET_ENDPOINT` is set, the intro screen tells participants their responses are
  recorded for the facilitator (so it stays transparent). Leave it `""` to keep everything local.
- The browser can't read the script's response (cross-origin), so saving happens silently in
  the background and never blocks the participant from seeing their profile. Verify collection
  by checking the Sheet.
