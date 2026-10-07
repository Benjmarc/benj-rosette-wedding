# Activate RSVP saving and calendar invitations

The website has an Apps Script endpoint configured in `rsvp-config.js`. Use these instructions to set up or redeploy the backend; verify live delivery separately. See [WEBSITE-HANDOFF.md](../WEBSITE-HANDOFF.md) for the full workflow.

1. Open the Apps Script project created from your RSVP spreadsheet:
   https://script.google.com/u/0/home/projects/1EoYLEcuXl0RogNiYfeTB_Jg2jxQEaX5tDYBHp4PTCR_r3eeCa-lWkaSM/edit
2. Replace the default contents of `Code.gs` with this folder’s `Code.gs` and save. Name the project “Benj & Rosette RSVP”.
3. Review `RSVP_CONFIG`: the ceremony starts December 15, 2026 at 2 PM Philippine time. The wedding calendar slot ends at 8 PM Philippine time. The invitation is sent from your default Google Calendar.
4. For the existing endpoint, select **Deploy → Manage deployments → Edit → New version**. Preserve its settings and deploy. A fresh web app uses **Deploy → New deployment → Web app**, and its URL must be configured separately. The current deployment executes as the owner with **Who has access: Anyone**, enabled with user approval on October 8, 2026. An unauthenticated submission with blank email successfully returned the saved confirmation. Preserve this setting so guests do not need a Google login.
5. Complete Google's authorization for Sheets and Calendar yourself. The script needs these permissions to save the guest details and email calendar invitations from your account.
6. Copy the resulting web-app URL ending in `/exec` and send it to Codex, or insert it as `endpoint` in `rsvp-config.js`.
7. Test with an email address you authorize for a test invitation, then verify the sheet row and email before sharing the website.

The targeted tab is `Form Responses 1`, gid 74886443. Existing headers `Timestamp` and `Save the date!` are preserved. The script appends columns for guest name, email, guest count, dietary requirements, message, request ID, invitation status, and event ID. Declines do not receive calendar invites. Email is optional. Replies without an email are saved with “No email provided” and do not create a calendar event. Repeat request IDs or supplied email addresses do not create another RSVP or calendar invitation; changes go through the couple. Blank emails are excluded from email duplicate checks.

The confirmation form opens Google's receipt in a new tab to reliably show the server result. It does not display a false “saved” message before Google confirms success. Calendar failures preserve the RSVP and mark “Needs follow-up” in the spreadsheet.

Local checks: `node integrations/test.cjs` and `node --check script.js`.

## Latest verified update — October 8, 2026

Apps Script **Version 5** uses invitation-style receipts: existing calligraphy artwork, cream background, gold frame/dividers, responsive spacing, and a Return to invitation button. The endpoint and access settings were retained. The website's HTTP request-ID failure was fixed in `script.js` with a `getRandomValues` fallback when `randomUUID` is unavailable. A live four-guest reply without email saved the guest count and companion names successfully. The user confirmed the same behavior. Run `node integrations/request-id.test.cjs` alongside the backend checks.

Three clearly marked technical test rows were left in the spreadsheet during verification; exclude them from attendance counts.

Public access was enabled on the existing Version 5 deployment without changing its URL or code version. Validation and duplicate checks still apply.
