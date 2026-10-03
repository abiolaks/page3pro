---
status: accepted
date: 2026-10-03
---

# Login depends on no external provider

Every Person who works for Talabon gets their own login.
They sign in with the phone number already held on their Person record plus a password, on their own smartphone or on a company desktop.

No one-time codes.
No SMS or WhatsApp provider appears anywhere in the login path, and no third party has to be reachable for someone to start work.

Holders of an Approving Role add a TOTP authenticator app as a second factor.

## Why not a one-time code

A one-time code exists to answer a question Talabon does not have: *is this stranger who they claim to be?*

Talabon has fewer than twenty people, all of whom physically come to one site, every one of whom HR onboards face to face, with a photograph and a guarantor form already on file.
At that size HR does not merely have records of these people, it knows them by sight.
HR handing someone a password across a desk, having just confirmed their identity by looking at them, is stronger evidence of identity than any SMS gateway can produce.
Buying that verification from a vendor, monthly, forever, would be paying to solve a problem the business has already solved better.

Two further reasons make the code actively worse than a password here.

Nigerian DND filtering blocks a great deal of bulk SMS, and one-time-code deliverability depends on properly registered transactional routes that still fail unpredictably.
A failed code is not a late message.
It is an employee standing at a terminal unable to work, with no path forward that does not involve a phone call to whoever administers the gateway.

And making a vendor a dependency of logging in means its outage is a full stop for the business rather than a degraded feature.
Nothing else in this system has that property, and authentication is the worst possible place to introduce it.

## Why TOTP rather than SMS for the money roles

TOTP is not a budget substitute for SMS codes.
It is strictly stronger.

SIM swap and intercepted SMS are the standard route into exactly this kind of system, and the accounts worth attacking are the handful that approve a Payroll Run or change a Grade.
Those five to ten people all carry smartphones and can scan a QR code once.
An authenticator app needs no network, no sender ID registration and no per-message fee, so the better option is also the free one.

## Devices

People sign in on a personal smartphone or on a shared company desktop.
Both are ordinary browsers, so the application is responsive web and nothing about the credential changes between them.

The shared desktop is the part that needs care, because the person who walks away is not always the person who sits down next.

Sessions are rows in D1 rather than self-contained tokens, so HR can revoke one immediately when someone exits.
Sessions carry a short idle expiry, sign-out is always visible rather than buried, and no persistent "remember me" is offered at all.
A payslip left open on a shop-floor desktop is a pay disclosure to everyone who walks past, and that risk is managed by expiry rather than by trusting people to log out.

## Password handling

Passwords are set in person by HR at onboarding and reset in person by HR.
There is no self-service reset, because a self-service reset needs a delivery channel and that is the dependency this decision exists to avoid.
At under twenty people on one site, walking to the HR desk is not a hardship.
Revisit if headcount passes roughly a hundred, or if a second site opens, since either breaks the in-person premise rather than merely straining it.

Hashing uses PBKDF2 through the Web Crypto API, which Workers supports natively with no dependency.

**Login requires the Workers Paid plan. This is measured, not assumed.**

PBKDF2-SHA256 timings, 256-bit output, median of five runs on an M-series laptop:

| Iterations | Time | Fits a 10 ms budget? |
|---|---|---|
| 10,000 | 1.2 ms | yes |
| 50,000 | 5.6 ms | yes |
| 100,000 | 10.9 ms | no |
| 210,000 | 23.0 ms | no |
| 600,000 | 65.0 ms | no |

The free plan's 10 ms CPU ceiling buys roughly 90,000 iterations.
OWASP's recommended 600,000 for PBKDF2-SHA256 overshoots it by about six and a half times, on hardware faster than Cloudflare's edge is likely to provide.

Two caveats on the measurement.
It was Node's Web Crypto rather than workerd, so it establishes the order of magnitude rather than the exact edge figure, and real Cloudflare hardware is likely slower rather than faster.
Neither caveat is close to mattering: the gap is multiples, not percentages, so no plausible hardware difference brings 600,000 iterations inside 10 ms.

So the resolution is the Workers Paid plan at five dollars a month, where the CPU limit is no longer a constraint of this kind.
That is the same order as the SMS bill this ADR avoids, and it lifts other free-tier friction at the same time.

The answer is never fewer iterations.
This is a payroll system, and a fast hash is the one shortcut that cannot be walked back after a leak.

Turnstile sits on the login form, and login attempts are rate limited per phone number.

## Consequences

The phone number stops being contact data and becomes a security credential.
Changing it is therefore an HR action against a verified identity, never an ordinary profile edit the holder can perform alone.
This was already true under the one-time-code design and remains true for a different reason: the number is now the username.

Login costs nothing and runs on the free plan.

An SMS or WhatsApp provider is still wanted eventually, but as a phase 2 *notification* channel: payslip ready, Leave approved, and the daily exceptions digest in the AI roadmap.
When a notification fails to send, someone misses an update.
When a login fails to send, the business stops.
Only the first of those is an acceptable thing to buy from a vendor.

When that choice is made, it is between local aggregators such as Termii and Africa's Talking.
Twilio is priced for Nigeria at roughly an order of magnitude above them and buys nothing in return.
