# COD Remittance Recovery · Razorpay app

**Couriers remit. Razorpay checks. You claim.**

A Razorpay mobile-app feature for D2C brands on Magic Checkout that ship cash-on-delivery through Shiprocket. After every Shiprocket payout, it checks each order against the brand's own Razorpay order record. When money is missing, paid short, or a wallet charge is wrong, it hands the founder a ready claim to send from their own email. COD goes from Shiprocket to the brand's bank, and Razorpay never holds it.

**Open the prototype:** `index.html` (or the GitHub Pages link).

## What's inside
- `engine.js`: the rules engine (deterministic, no AI). It works out what is owed (order total − online advance), when each order is due (Shiprocket Standard: first Mon/Wed/Fri after 8 working days), and when it can be claimed (after Shiprocket's 10 working days, with two payouts received). It never claims during a held payout and checks wallet charges.
- `data.js`: the demo merchant Papaearth (orders, Shiprocket shipments, payout lines, wallet statement, daily reports), built deterministically.
- `scenarios.js`: seven situations (money to claim, all paid, late, payout on hold, report not received, needs a look, after recovery).
- `app.js`, `styles.css`, `index.html`: the app screens in the Razorpay app's look, plus a "behind the scenes" panel (Guide, Situations, Data, Rules).

Every number on screen is computed live by the engine from the data.

## Data sources in the product
- Razorpay Magic Checkout orders (total, partial-COD advance)
- Shiprocket API through the merchant's existing Magic Checkout connection: shipments, tracking, COD amount, wallet statement and balance
- Shiprocket's scheduled daily Remittance Report, delivered to a per-merchant Razorpay address

Built with Claude (Anthropic) for research, stress-testing, writing and code.
