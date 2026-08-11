# SoftWalk COD sales funnel

Next.js App Router product funnel for **Summer Comfort Sandals**. It includes a product landing page, checkout, thank-you page, Google Sheets order storage, and two branded email notifications.

## Recommended stack and order flow

- **Next.js + Tailwind CSS** provides fast, responsive pages and a server-only API route.
- The landing page carries selected quantity and calculated product total to `/checkout` in the URL. The checkout recomputes the delivery-inclusive total and submits JSON to `POST /api/order`.
- The server validates all fields, creates an Order ID, then appends the order to Google Sheets. Only after that succeeds it sends an internal notification and customer confirmation email. A success response redirects the customer to `/thank-you`; any failure stays on checkout with an error.
- The API does not expose credentials to the browser. It uses Google service-account credentials and SMTP credentials from environment variables only.

## Local setup and testing

1. Run `npm install`.
2. Copy `.env.example` to `.env.local` and complete every value.
3. Run `npm run dev`, open `http://localhost:3000`, choose a quantity, and submit a test order.
4. Confirm a row arrives in Google Sheets, the business inbox gets an email, the test customer inbox gets an email, and the browser reaches the thank-you page. Use a separate test sheet first.

## Google Sheets setup

1. Create a Google Spreadsheet and use the tab named `Sheet 1` (or change `GOOGLE_SHEET_TAB_NAME`).
2. In row 1 add exactly: `Order ID`, `Date & Time`, `Customer Name`, `Phone Number`, `Email Address`, `Exact Location`, `Product Name`, `Quantity`, `Price Per Piece`, `Total Price`, `Payment Method`, `Order Status`, `Notes`.
3. Copy the ID from the spreadsheet URL, between `/d/` and `/edit`, into `GOOGLE_SHEET_ID`.
4. Create a Google Cloud service account, enable the **Google Sheets API**, and create a JSON key. Copy `client_email` into `GOOGLE_SERVICE_ACCOUNT_EMAIL` and `private_key` into `GOOGLE_PRIVATE_KEY`; preserve it as one line with `\\n` escapes in `.env.local`.
5. Share the spreadsheet with the service account email as **Editor**.
6. For order-status dropdowns: select the Order Status column → **Data → Data validation → Dropdown** → add `New Order`, `Order Confirmed`, `Order Ongoing`, `Delivered`, and `Cancelled`. Turn on a filter from **Data → Create a filter**.

## Email setup

Configure an SMTP provider. For Gmail SMTP, use `smtp.gmail.com`, port `587`, your Gmail address as `SMTP_USER`, and a Google App Password (not your normal Gmail password) as `SMTP_PASS`. Set `BUSINESS_EMAIL` and `EMAIL_FROM` to `softwalk28@gmail.com` or your verified sending address. `EMAIL_SERVICE_API_KEY` is reserved for a future API-based provider and is not used by this SMTP implementation.

## Product images

The supplied product images are stored in `public/products/` and are already wired into `lib/product.ts`. To replace them later, add the new optimized images there and update that list. Use at least 1200px-wide PNGs for the crispest display.

## Deploy to Vercel

1. Push this repository to GitHub and import it into Vercel.
2. Add every variable from `.env.example` under **Settings → Environment Variables** (use Production and Preview as appropriate).
3. Set `NEXT_PUBLIC_SITE_URL` and `FRONTEND_URL` to your final `https://...vercel.app` or custom domain.
4. Deploy, then place a test order and check the sheet and both emails before sharing the link.

`/api/order` is a Next.js server route, so it works on Vercel without a separate backend or CORS configuration. Keep the site and API on the same domain.
