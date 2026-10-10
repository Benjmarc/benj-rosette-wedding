# Activate RSVP saving and calendar invitations

The website has an Apps Script endpoint configured in `dist/rsvp-config.js`. Use these instructions to set up or redeploy the backend; verify live delivery separately. See [WEBSITE-HANDOFF.md](../WEBSITE-HANDOFF.md) for the full workflow.

1. Open the Apps Script project created from your RSVP spreadsheet:
   https://script.google.com/u/0/home/projects/1EoYLEcuXl0RogNiYfeTB_Jg2jxQEaX5tDYBHp4PTCR_r3eeCa-lWkaSM/edit
2. Replace the default contents of `Code.gs` with this folder’s `Code.gs` and save. Name the project “Benj & Rosette RSVP”.
3. Review `RSVP_CONFIG`: the ceremony starts December 15, 2026 at 2 PM Philippine time. The wedding calendar slot ends at 8 PM Philippine time. The invitation is sent from your default Google Calendar.
4. For the existing endpoint, select **Deploy → Manage deployments → Edit → New version**. Preserve its settings and deploy. A fresh web app uses **Deploy → New deployment → Web app**, and its URL must be configured separately. The current deployment executes as the owner with **Who has access: Anyone**, enabled with user approval on October 8, 2026. An unauthenticated submission with blank email successfully returned the saved confirmation. Preserve this setting so guests do not need a Google login.
5. Complete Google's authorization for Sheets and Calendar yourself. The script needs these permissions to save the guest details and email calendar invitations from your account.
6. Copy the resulting web-app URL ending in `/exec` and send it to Codex, or insert it as `endpoint` in `dist/rsvp-config.js`.
7. Test with an email address you authorize for a test invitation, then verify the sheet row and email before sharing the website.

The targeted tab is `Form Responses 1`, gid 74886443. Existing headers `Timestamp` and `Save the date!` are preserved. The script appends columns for guest name, email, guest count, dietary requirements, message, request ID, invitation status, and event ID. Declines do not receive calendar invites. Email is optional. Replies without an email are saved with “No email provided” and do not create a calendar event. Repeat request IDs or supplied email addresses do not create another RSVP or calendar invitation; changes go through the couple. Blank emails are excluded from email duplicate checks.

The confirmation form opens Google's receipt in a new tab to reliably show the server result. It does not display a false “saved” message before Google confirms success. Calendar failures preserve the RSVP and mark “Needs follow-up” in the spreadsheet.

Local checks: `node integrations/test.cjs` and `node --check dist/script.js`.

## Latest verified update — October 8, 2026

Apps Script **Version 5** uses invitation-style receipts: existing calligraphy artwork, cream background, gold frame/dividers, responsive spacing, and a Return to invitation button. The endpoint and access settings were retained. The website's HTTP request-ID failure was fixed in `dist/script.js` with a `getRandomValues` fallback when `randomUUID` is unavailable. A live four-guest reply without email saved the guest count and companion names successfully. The user confirmed the same behavior. Run `node integrations/request-id.test.cjs` alongside the backend checks.

Three clearly marked technical test rows were left in the spreadsheet during verification; exclude them from attendance counts.

Public access was enabled on the existing Version 5 deployment without changing its URL or code version. Validation and duplicate checks still apply.

## Calendar description update

Version 6, deployed October 8, 2026 around 4:40 AM Philippine time, adds the wedding website link to newly created calendar invitation descriptions: https://benj-rosette-wedding.online/. Existing events were not changed or resent. The endpoint and public access settings are retained. Backend checks verify the link; no test email was sent for this change.

### RSVP calendar invitations without Google Meet — October 10, 2026

In the calendar owner’s Google Calendar Settings → Event settings, **Automatically add Google Meet video conferences to events I create** is disabled. The saved setting was verified in the signed-in owner account. `CalendarApp.createEvent` does not explicitly add conferencing, so no Apps Script redeployment is required. This account-wide preference also affects other newly created calendar events. Existing invitations and previously emailed Meet links were not modified or resent. Keep this option off when operating the RSVP backend.

### One shared RSVP calendar event — October 10, 2026

The RSVP backend now uses **Google Calendar API v3**, enabled as the Apps Script advanced service `Calendar`. All accepted RSVPs with an email join the same owner-calendar event, API ID `benjrosette20261215`, December 15, 2026, 2–8 PM Asia/Manila. The guest list is hidden; guests cannot edit the event or invite others. Additional household guests are represented by the attendee’s `additionalGuests` count. Blank-email replies and declines still save without a calendar invitation.

Run `initializeWeddingCalendar` once as the owner before deploying: it creates the shared event without attendees or emails, using a stable event ID. Regular submissions retrieve and patch this event; they never create individual events. The existing script lock serializes RSVP additions. Existing attendees and their response statuses are preserved. `sendUpdates: all` requests calendar invitations/updates, including for non-Google email addresses; Google may notify existing attendees when the event changes. Conference data is cleared and automatic Meet remains disabled. A missing or cancelled event leaves RSVP saved as **Needs follow-up**; restore the event rather than changing its ID casually.

With explicit user approval, `migrateExistingWeddingGuests` added **3 existing RSVP email addresses** to the shared event on October 10, 2026. This sends new invitations. Only accepted replies with valid emails are included; marked test/Codex/technical names are excluded. `previewExistingWeddingGuests` is read-only. Migration is idempotent: already-added emails are not added or notified again. Spreadsheet rows now reference the shared API event ID; original individual event IDs are retained in **Previous calendar event ID**. Old individual events were not deleted or cancelled, so previously invited guests may still see those alongside the new shared event.

After code changes, redeploy the existing public web app using Manage deployments → Edit → New version, preserving Execute as owner, Anyone access, and its `/exec` URL. Backend tests cover shared-event reuse, invitations, guest privacy, retained attendee responses, historical migration, no-email/decline behavior, duplicate protection, and calendar failures. No synthetic live RSVP/email was submitted for this update; existing guest invitations were explicitly authorized.

Live deployment: **Version 7**, October 10, 2026 at 2:36 PM Philippine time; original public endpoint retained. Shared event created; 3 existing RSVP email addresses invited with user approval.
