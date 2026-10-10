# Benj & Rosette — portable project handoff

This guide covers website edits, GitHub publication, Namecheap DNS, RSVP, PDF invitations, and monogram video creation. It reflects files inspected on **October 8, 2026**. Inspect the current code and live services before making changes; last observed status is not a guarantee of present availability.

## Project facts

- Couple: **Benj & Rosette**; wedding **December 15, 2026**, Philippine time (UTC+08:00).
- Ceremony: **2:00 PM**, Saint Joseph The Worker Chapel, Pedro Reyes St., Malagasang 1-G, Imus City, Cavite.
- Reception: **4:00 PM**, Priscilla Crystal Palace, San Sebastian, Kawit, Cavite.
- RSVP deadline: November 6, 2026. Verify the current HTML before changing dates.
- Repository: <https://github.com/Benjmarc/benj-rosette-wedding>.
- Original site: <https://benjmarc.github.io/benj-rosette-wedding/>.
- Purchased domain: `benj-rosette-wedding.online`, through Namecheap.
- Hosting: **GitHub Pages**, publishing **main**, repository **root**.

## File map

Run commands from the outer `wedding-rsvp-website` directory unless stated otherwise.

| Path | Purpose |
| --- | --- |
| `wedding-site/dist/index.html` | Main content, menu, envelope, RSVP form |
| `wedding-site/dist/styles.css` | Responsive layout, artwork placement, masks, animation |
| `wedding-site/dist/script.js` | Envelope/menu interactions, countdown, RSVP |
| `wedding-site/dist/rsvp-config.js` | Current public Apps Script endpoint |
| `wedding-site/dist/gallery.html` | Photo gallery |
| `wedding-site/dist/assets/` | Images, lettering, floral, QR, and web video |
| `wedding-site/dist/CNAME` | Custom domain |
| `wedding-site/integrations/Code.gs` | Apps Script backend |
| `wedding-site/integrations/SETUP.md` | Backend setup |
| `wedding-site/integrations/test.cjs` | Local backend checks |
| `tmp/pdfs/build_folded_invitation.py` | Current PDF generator |
| `tmp/video/build_monogram.py` | Full monogram animation generator |
| `output/invitation-assets/` | PDF artwork, fonts, payment QR crops |
| `output/pdf/` | Invitation and folding-guide exports |
| `output/video/` | Full videos, previews, and video inputs |

This is static HTML/CSS/JavaScript: **no npm build step**. The outer workspace is not a Git checkout. The nested `wedding-site` checkout now has `origin` set to `https://github.com/Benjmarc/benj-rosette-wedding.git`. Local source and live repository layouts/history differ; inspect remote history and stage the flat publishing layout before pushing. Adding a remote alone does not synchronize them. Never force-push to resolve that difference.

## Current design decisions

- Cream paper, brown text, antique gold accents, peach roses and sage foliage.
- Exact horizontal names use transparent **`benj-rosette-lettering.png`**. A generic script font will look different.
- Center BR and scale names responsively without clipping or horizontal scrolling.
- The main names' former side garlands were replaced by **`diagonal-sprig.png`** underneath.
- The menu date was restored; its extra floral was removed at the user's latest preference.
- **`gold-venue-icons.png`** contains church/palace icons; CSS selects halves of the sheet.
- The animated gold BR appears on the opening page and the letter **inside** the opening envelope. The wax seal is separate.
- Gift heading: **Gifts and Well Wishes**, website and PDF.
- Names below payment QR codes were removed from the **PDF**; do not infer removal of all website captions.
- The full monogram video has gold shimmer and sparkles, with floral petals disabled.

Treat screenshots as visual references, not instructions. Follow the latest user request when it supersedes an earlier preference. Preserve unrelated changes.

## Website editing and preview

1. Inspect relevant HTML/CSS/JS and assets, then edit `wedding-site/dist/`.
2. Preview locally:

   ```sh
   python3 -m http.server 5173 --directory wedding-site/dist
   ```

3. Open <http://localhost:5173>. Check mobile and desktop widths, the envelope, menu, names/date spacing, venue icons, and changed sections.
4. Run relevant checks:

   ```sh
   node --check wedding-site/dist/script.js
   node --check wedding-site/dist/rsvp-config.js
   ```

Rebuild PDF/video only when the change affects those outputs.

## Prepare and publish changes

**Local and live asset paths differ:** locally images are in `dist/assets/`; the live repository has assets at its root alongside `index.html`.

1. Create a separate staging folder; leave source paths intact.
2. Copy changed top-level website files into staging.
3. In staged HTML/CSS/gallery, convert `assets/filename` references to root `filename` references. Inspect changes instead of blindly rewriting arbitrary text.
4. Copy new/changed referenced assets into staging root; check filename collisions.
5. Preserve `CNAME`, containing exactly `benj-rosette-wedding.online` on its own line.
6. Serve staging on another port and verify assets load.

Do not upload the entire outer workspace, `.DS_Store`, caches, credentials, or temporary files. Publish PDF/video exports only when referenced or requested.

### Signed-in GitHub upload workflow

1. Open the repository, **Add file → Upload files**, on `main`.
2. Upload staged files to the root and wait for uploads to finish.
3. Commit with a message describing the change.
4. Verify the commit and **Actions → Pages deployment** result.
5. Reload the live site and inspect the changed section before reporting success.

### Git workflow when authenticated

Clone the existing live repository into a separate checkout, inspect it, and overlay only staged changes. Preserve existing root assets and `CNAME`. Review `git diff`, stage intended files, commit, and push `main`. Do not replace remote history or initialize an unrelated repo to bypass authentication. Use signed-in uploads if Git authentication is unavailable.

Ordinary website updates need **no Namecheap DNS changes**. GitHub deploys the new commit; the same domain serves it. Deployment time varies. Verify deployment independently of the commit. If old content remains, inspect loaded resources and reload; update the existing CSS cache version when needed.

## Namecheap domain and HTTPS

The purchased `.online` domain uses **BasicDNS**, not the earlier FreeDNS-only setup for another domain. Open **Domain List → Manage → Advanced DNS → Host Records**.

| Type | Host | Value |
| --- | --- | --- |
| A | `@` | `185.199.108.153` |
| A | `@` | `185.199.109.153` |
| A | `@` | `185.199.110.153` |
| A | `@` | `185.199.111.153` |
| CNAME | `www` | `benjmarc.github.io` |

Preserve unrelated mail/TXT records. Avoid conflicting parking or URL redirect records at these hosts. The `www` target has no repository path.

GitHub **Settings → Pages → Custom domain** is `benj-rosette-wedding.online`. Enable **Enforce HTTPS** once the certificate is ready. DNS propagation and HTTPS availability can each take up to 24 hours. See [GitHub custom-domain documentation](https://docs.github.com/en/pages/configuring-a-custom-domain-for-your-github-pages-site/managing-a-custom-domain-for-your-github-pages-site) and [Namecheap's GitHub Pages guide](https://www.namecheap.com/support/knowledgebase/article.aspx/9645/2208/how-do-i-link-my-domain-to-github-pages/).

**Latest verified, October 8, 2026, around 4:10 AM Philippine time:** the apex website loaded over HTTPS in the in-app browser, and Pages deployment #103 succeeded. Earlier HTTP/Chrome 404 and pending TLS observations are historical. Native Chrome, `www` HTTPS, and the Enforce HTTPS checkbox were not rechecked in this verification; check those separately if troubleshooting them.

```sh
dig +short benj-rosette-wedding.online A
dig @8.8.8.8 +short www.benj-rosette-wedding.online CNAME
dig @1.1.1.1 +short www.benj-rosette-wedding.online CNAME
curl -I --max-time 15 http://benj-rosette-wedding.online/
curl -I --max-time 15 https://benj-rosette-wedding.online/
```

Check apex and `www`, GitHub settings/deployment, and a normal browser. Correct DNS does not prove HTTPS readiness. Do not bypass certificate warnings to call setup successful.

The domain was shown as expiring October 7, 2027, auto-renew off. Recheck Namecheap. Domain renewal is separate from hosting; website updates do not require buying the domain again. Prices can change.

## RSVP integration

`rsvp-config.js` already contains an Apps Script `/exec` endpoint. A local URL does not prove the live backend is functioning.

- `Code.gs` holds spreadsheet/tab and calendar configuration.
- The form opens Google's receipt in a new tab to show server success/failure.
- Accepted RSVPs with an email can receive calendar invitations; declines and replies without email do not.
- Duplicate request IDs/email are handled by the backend. Calendar failure preserves the RSVP and marks follow-up.
- A blank endpoint activates the frontend's local draft fallback.

For backend edits, copy `Code.gs` into the existing Apps Script project. Review configuration, then **Deploy → Manage deployments → Edit → New version** to retain the URL. A new deployment may require updating and publishing `rsvp-config.js`. The existing deployment executes as the owner with access set to **Anyone**. The user approved removing the Google-login requirement on October 8, 2026. An unauthenticated POST with blank email returned attendance confirmed and RSVP saved; the endpoint was retained. The owner handles Google authorization. See `integrations/SETUP.md` for project access.

```sh
node wedding-site/integrations/test.cjs
node wedding-site/integrations/request-id.test.cjs
node --check wedding-site/dist/script.js
```

Test with a user-authorized email; verify sheet row, receipt, and calendar result. Do not send unsolicited guest invitations or include private guest data/tokens in documentation.

### October 8 RSVP fix, confirmation design, and public access

- Failure: submissions from the HTTP custom domain reached Apps Script with an invalid/empty request ID. The server logged `Invalid RSVP` and did not save a row. The frontend called HTTPS-only `crypto.randomUUID()` without a fallback.
- Fix: `createRsvpRequestId()` in `dist/script.js` uses native `randomUUID()` when available, otherwise creates a valid UUID with `crypto.getRandomValues()`. If generation fails, submission is prevented and the page explains that the reply was not sent.
- Website publication: GitHub commit `823680fadf6b532dc1ab5300accfc76a1320ec36`, Pages run #103 succeeded. Local source commit: `a1a82c8`.
- Verification: a live no-email RSVP with four total guests saved to the sheet. Guest count was 4, all three companion names appeared in **Message for the couple**, and calendar status was **No email provided**. The user also confirmed their own additional-guest/no-email submission worked.
- Regression checks cover HTTP UUID generation, HTTPS path, unique valid IDs, blank email, and additional guests. Backend tests verify saved guest count/companion names and absence of calendar calls for blank email.
- Receipt design: `receipt_()` in `integrations/Code.gs` now uses the existing calligraphy image from the HTTPS site, cream background, gold double frame, centered date/dividers, responsive contact links, and a Return to invitation button. All receipt types share the design while retaining their actual success/error messages. Names artwork is externally hosted; its image URL must remain valid.
- Apps Script was updated through **Manage deployments → Edit → New version**, retaining the existing `/exec` endpoint and access settings. **Version 5**, deployed around **4:19 AM Philippine time**, contains the new design. No frontend endpoint change was required. Local source commit: `98949ac`.
- A live no-email design test showed **Your attendance is confirmed** with the new artwork. Three clearly marked technical test rows were added during these checks, including an unauthenticated access test; they are not real wedding attendees and were left in the sheet. Do not count them in attendance totals.

### Public access update

The previous **Anyone with Google account** restriction prevented guests without a Google login from submitting. With user confirmation, the existing deployment was changed to **Anyone**, keeping **Execute as: Me**, code **Version 5**, and the same `/exec` URL. An unauthenticated no-email test returned **Your attendance is confirmed** and **Your RSVP is saved** without a login redirect. Existing validation and duplicate protection still apply; public access does not guarantee saving invalid submissions or bypass duplicate rules. An additional marked technical test row remains in the sheet. If a phone still fails, retry in its normal browser and capture the exact receipt/error before diagnosing another cause.

### Calendar website link

Apps Script **Version 6**, deployed October 8, 2026 around **4:40 AM Philippine time**, adds `Wedding invitation and details: https://benj-rosette-wedding.online/` to the calendar event description. The existing public endpoint is retained. This applies to newly created calendar invitations; existing events were not edited or resent. Backend tests assert that the description includes the link. No test email was sent for this update.

## PDF invitation creation

Use **`tmp/pdfs/build_folded_invitation.py`**, not the older builder. It produces two sides of a three-panel roll-fold invitation.

- Outside: Dress Code, Gifts and Well Wishes, Front Cover.
- Inside: Wedding Day, Main Invitation, Entourage.
- Finished size approximately 5 × 7 inches; open trim width 14 11/12 inches, with a slightly narrower tuck-in panel.
- Entourage/events are extracted from website HTML; structural HTML changes may require extraction-code changes.
- Preserve four original payment QR crops and bank labels. Latest PDF has no names below QR codes. Never use AI image generation to redraw functional payment QR codes.
- The builder still uses the original GitHub Pages URL. Review printed links/QR destinations before switching to the custom domain; verify HTTPS first.

Dependencies: Python, Pillow, ReportLab, pypdf, pypdfium2. Font paths include macOS Times New Roman, fonts in `output/invitation-assets/`, and `/private/tmp/GreatVibes-Regular.ttf`. The temporary font can disappear. For portability, store required licensed fonts durably and update paths.

```sh
python3 tmp/pdfs/build_folded_invitation.py
```

Outputs:

- `output/pdf/Benj-and-Rosette-Folded-Invitation.pdf`
- `output/pdf/Benj-and-Rosette-Canva-Invitation.pdf` — matching alias
- `output/pdf/Benj-and-Rosette-Folding-and-Envelope-Guide.pdf`
- Rendered preview PNGs in `tmp/pdfs/`

Inspect both sides: frames, spacing, folds, panel order, names/date, and QR borders. Keep alias and folding guide consistent. Test QR codes on an actual-size print before bulk printing; visual review alone does not establish scannability.

## Monogram video creation

**`tmp/video/build_monogram.py`** creates frames with Pillow/NumPy and encodes with FFmpeg. Existing lettering is reused, so another AI should edit this script rather than redraw the names.

### Inputs and animation

- `wedding-site/dist/assets/benj-rosette-monogram.png`: transparent BR, cropped to visible bounds and centered.
- `wedding-site/dist/assets/benj-rosette-lettering.png`: exact horizontal calligraphy beneath BR.
- Spaced serif date `DECEMBER 15, 2026`, gold divider and central diamond.
- Warm radial background, pulsing gold glow, moving highlight constrained by BR alpha, sparkle particles.
- Floral petals are disabled by `petals=[]`. The script still loads `output/video/rose-petal-sprites.png` before disabling them; it remains a dependency until unused code is removed.
- `/private/tmp/GreatVibes-Regular.ttf` is still loaded although names use artwork. Preserve it or remove the unused font load when porting.

| Setting | Current value |
| --- | --- |
| Resolution | 1920 × 1080 |
| Duration / frame rate | 24 seconds / 24 fps |
| Audio | None |
| Encoding | H.264 `libx264`, CRF 18, fast preset |
| Browser compatibility | `yuv420p`, MP4 fast start |
| Full export | `output/video/Benj-and-Rosette-Calligraphy-v13.mp4` |
| Still preview | `output/video/Benj-and-Rosette-Calligraphy-v13-preview.jpg` |
| Encoder log | `tmp/video/encode.log` |

### Edit and render

1. Provide Python with Pillow/NumPy and FFmpeg on `PATH`.
2. Verify input images/fonts and output/log directories exist.
3. Adjust layout in the script: `monogram_position`, name thumbnail dimensions and placement (currently y=620), date y=980, divider y=935. Coordinate changes to avoid clipping or excessive spacing.
4. When retaining old exports, choose a new version for both MP4 and preview filenames.
5. Render from project root:

   ```sh
   python3 tmp/video/build_monogram.py
   ```

6. Inspect the still preview and play the whole video. Check names, date, BR alignment, shimmer, and loop transition. Completion requires successful encoder exit and output inspection.
7. Verify metadata:

   ```sh
   ffprobe -v error -show_entries stream=codec_name,width,height,r_frame_rate,pix_fmt -show_entries format=duration -of json output/video/Benj-and-Rosette-Calligraphy-v13.mp4
   ```

Rendering hundreds of full HD frames takes longer than a still-image edit. Monitor the process and encoder log instead of repeatedly restarting it.

### Updating the website video

The website uses a separate cropped clip, **`wedding-site/dist/assets/benj-rosette-gold-monogram.mp4`**. Rebuilding the full export does not automatically replace it. CSS masks the clip using the transparent BR artwork.

A previous web clip was cropped from an earlier full video with coordinates `582:434:670:230`, encoded H.264 CRF 22, `yuv420p`, fast start. **Do not blindly use that crop for v13:** BR placement changed.

Derive the new crop from current BR bounds, excluding names/date. Encode and inspect a small MP4 with the existing mask. Preserve muted/autoplay/loop/inline behavior. Publish through the flat asset workflow; test opening page and envelope inner letter. Do not change the wax seal unless requested.

## Messenger and social link preview

The main page includes Open Graph and Twitter card metadata. Title: **You're Invited!**. Description: **Join us on December 15, 2026 as we celebrate our wedding. View the details and confirm your attendance.** The image is `wedding-share-preview.jpg`, copied from the existing v13 gold monogram still (1920 × 1080). Local source asset is in `dist/assets/`; the live image is at the site root. Absolute HTTPS URLs identify the image and canonical website. Keep these tags in the static HTML head so crawlers can read them without opening the animated invitation.

Social apps control preview cropping and whether the description is visible. Updating metadata does not guarantee old Messenger messages refresh. Use Meta's Sharing Debugger to request a fresh scrape if needed, and verify a newly shared link. No Messenger message was sent as part of adding these tags.

## Documentation maintenance

After changing behavior, deployment, domain settings, or generated artifacts, update this guide and relevant setup notes with the final implementation, verified result, version/commit, and remaining limitations. Keep the outer workspace copy synchronized with this repository copy. Do not record private guest data or credentials.

## Completion checklist

- Inspect actual changes and preserve unrelated work.
- Preview affected mobile/desktop layouts and relevant PDF/video exports.
- Run appropriate checks.
- For requested publishing, verify commit, deployment, and live result separately.
- Report unresolved DNS/HTTPS, RSVP delivery, font portability, or QR testing accurately.

## Reusable prompt for another AI

> Read WEBSITE-HANDOFF.md and inspect the project first. My requested change is: [describe change]. Preserve current Benj & Rosette artwork, content, RSVP integration, and custom-domain CNAME unless my request changes them. Use wedding-site/dist as website source and preserve the flat asset layout for GitHub publication. Use the current PDF/video generators for related exports and inspect the outputs. Follow my current authorization for publishing or sending invitations; request only missing information/access that is necessary. Report changed files, checks, publication status, and remaining issues.

For another computer/tool, transfer this guide, `wedding-site/dist/`, `wedding-site/integrations/`, both builder scripts, required invitation/video inputs, and licensed fonts. Exclude credentials/private guest data. Review dependencies and absolute paths before running.

### Mobile monogram visibility

Both the envelope card and opening invitation display a gold still beneath their videos. The still is extracted at 2 seconds from the existing cropped monogram clip (`benj-rosette-gold-monogram-poster.jpg`). Videos become visible only after `playing`, and fall back to the still when paused or failed. Opening the envelope retries muted inline playback during the user gesture and again after revealing the invitation. Phone power-saving or autoplay restrictions can still prevent animation; the gold BR remains visible. HTML uses updated CSS/JS query versions to refresh cached code. Verify both locations on mobile, including autoplay blocked.

Mobile opening spacing: below 600px, the opening no longer fills the viewport or vertically centers its contents. Top padding scales from 100px to 125px. The verse is centered with equal side margins and a narrower text column to clear the floral; bottom padding is 40px. CSS cache version: `mobile-spacing-25`.

### Entourage name correction — October 10, 2026

The witness name is **MRS. DIOSNELA GOMEZ** on the website and regenerated folded/Canva invitation PDFs. Update names in `dist/index.html`, then rebuild with `tmp/pdfs/build_folded_invitation.py` from the outer workspace. Both PDF exports were checked for the corrected name and the entourage panel was visually inspected.
