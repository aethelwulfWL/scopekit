# ScopeKit

**An offline proposal builder for independent web designers.**

ScopeKit turns project deliverables, fees and revision limits into a client-ready proposal. Edit the scope on the left, review the document on the right, and export when it is ready to share.

Built with vanilla JavaScript, HTML and CSS. The application runs entirely in the browser and ships as a single HTML file with no runtime dependencies.

## What it does

- Starts from three editable scopes: landing page, multi-page website and one-month care plan.
- Calculates line-item fees, deposits and remaining balances.
- Makes client responsibilities, exclusions and revision rounds part of the proposal.
- Updates the client preview as you type.
- Saves one active draft locally and supports portable JSON backups.
- Exports a standalone HTML proposal or prints through the browser's PDF dialog.
- Supports USD, EUR, GBP, TRY, CAD and AUD formatting.
- Adapts to desktop and mobile screens, with labeled controls and visible keyboard focus.

## Try it

Download [ScopeKit.html](ScopeKit.html), then open the downloaded file in a modern browser. No installation or server is required. The initial client, studio and prices are fictional examples.

1. Select a starting scope and enter your project details.
2. Adjust the deliverables, quantities and unit prices.
3. Set the deposit, revision rounds and scope boundaries.
4. Use **Back up draft** to keep a portable copy.
5. Choose **Export proposal**, or **Print / PDF** and select **Save as PDF**.

For PDF export, select A4 paper and disable browser headers and footers. Review the result before sending it to a client.

## Engineering decisions

**Offline by design.** All document generation, validation and storage happen on the device. There are no accounts, analytics, external fonts or network requests from the application.

**Separate calculation and presentation.** `core.js` contains normalization, pricing and proposal rendering. `app.js` connects those functions to the editor, browser storage and downloads. The core can be tested directly without a browser.

**Explicit rounding.** Unit prices are rounded to cents before quantity multiplication, each line rounds to cents, and deposits are calculated from the resulting total. The remaining balance is the total minus the deposit, so both always reconcile.

**Treat imported content as untrusted.** Drafts pass through schema and numeric bounds checks. User-provided text is escaped before it appears in proposal markup. Invalid imports leave the active draft intact.

**A small distribution format.** A dependency-free Node script combines the source files into `ScopeKit.html`. Customers can keep and open the complete application as one file.

## Develop

Use Node.js 22 or newer for the development commands. The application itself only needs a browser.

```sh
npm test
npm run build
```

No `npm install` is needed: there are no package dependencies. After changing the source, run the build command and reopen or reload `ScopeKit.html`.

| File                  | Responsibility                                                   |
| --------------------- | ---------------------------------------------------------------- |
| `core.js`             | Draft validation, money calculations and escaped proposal markup |
| `app.js`              | Editor events, live preview, browser storage, import and export  |
| `shell.html`          | Semantic application layout and form controls                    |
| `style.css`           | Responsive interface and print styles                            |
| `build.cjs`           | Single-file distribution build                                   |
| `tests/core.test.cjs` | Core behavior tests using Node's native test runner              |

## Verification

Ten automated tests cover deposits, rounding, fractional quantities, invalid inputs, malformed imports and escaped proposal content. Manual Chromium checks cover live calculations, persistence across reloads, adding and removing deliverables, invalid-deposit export protection and desktop/mobile layout.

Saved PDF output, file-picker import and browser-specific local-file persistence still need broader end-to-end testing. Firefox and Safari have not been verified.

## Boundaries

- One active draft per browser storage context. Back up individual projects as JSON.
- Local-file storage behavior varies by browser and can change if the file moves or browser data is cleared. Backups are the durable copy.
- Stored drafts and exported files are unencrypted.
- Currency selection changes formatting; it does not convert prices.
- Fees are before applicable taxes. Tax calculation, invoicing, payments and electronic signatures are outside the project scope.
- The care-plan preset covers one month, not an automatically renewing subscription.
- The output is a proposal estimate, not a signed agreement.

ScopeKit is a functional portfolio project demonstrating browser-based document generation, input validation, local persistence and responsive interface design.
