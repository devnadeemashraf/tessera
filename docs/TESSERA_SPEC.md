# Tessera: product and engineering spec (v2)

Tagline: Keep your word.
Philosophy: Quiet until it matters.

## 1. Principles
1. Local by default. No account, no network, no server until the user asks.
2. The server is assumed hostile. It only ever stores ciphertext.
3. Consent is a gesture. Every fill needs a fresh PIN or biometric check
   that names the item and the destination.
4. One decision per screen. Plain words, no jargon.
5. Security features are never paywalled. Paid plans sell convenience.
6. Leaving is a feature: open export formats, documented vault format.
7. Boring, published cryptography. One shared core to audit.

## 2. Three modes
| Mode | Account | Network | Cost to user |
| --- | --- | --- | --- |
| Local (default) | None | None | Free forever |
| Tessera Cloud | Email + password | Our hosted sync | Free up to 2 devices |
| Self-hosted | On own server | Their server | Free, no cap |

Switching modes never re-encrypts items. It only adds or removes a sync target.

## 3. Platforms
- Tier 1 (built and tested by the core team): Android, Windows, Linux,
  browser extension (Chrome, Firefox, Edge), sync server.
- Tier 2 (community maintained): iOS, macOS, Safari extension.
- Web vault: ships with the server in the sync phase; management only.

## 4. Architecture
```
Android (Kotlin/Compose)   Windows + Linux (Tauri)   Extension (TS + WASM)
        │ UniFFI                  │ native                 │ native messaging
        └──────────────┬──────────┴────────────────────────┘
                       ▼
     tessera-core (Rust): crypto, vault store, merge, autofill matching,
     generator, passkey authenticator, importers, backup
                       │   only when sync is on
                       ▼
     tessera-server (Rust, one binary): SQLite or Postgres, blob storage
     billing service (hosted only): issues signed entitlement tokens
```

## 5. Local mode
- Zero network calls. No analytics, no icon fetching, no breach lookups
  unless the user turns them on. The Android FOSS build has no INTERNET
  permission until sync is enabled via a separate build flavor.
- Store: SQLite file with per-item encryption, in app-private storage.
- Backups, because a lost phone otherwise means a lost vault:
  - Encrypted `.tessera` backup file, protected by the vault password.
  - Scheduled automatic backup to a folder the user picks.
  - A "Backup health" indicator on Home; red after 30 days without one.
- Move to a new device without a server: QR pairing plus a one-time
  encrypted transfer over the local network.
- OS cloud backup of app data is disabled; hardware keys never leave the device.

## 6. Cryptography
```
Local mode:
  Vault password ─► Argon2id ─► Unlock Key ─► unwraps Account key set
Sync mode adds:
  Setup code (128-bit, generated when sync is turned on)
  Unlock Key = HKDF(Argon2id(password), setup code)
  Login = OPAQUE; the password never reaches the server
Account key set ─► Vault keys ─► Item keys ─► item payload, attachments
Device hardware key ─► wraps Unlock Key for PIN / biometric unlock
```
| Purpose | Choice |
| --- | --- |
| Password stretching | Argon2id, 64 MiB, 3 passes; client-enforced floor |
| Item encryption | XChaCha20-Poly1305; AAD binds item, vault, revision |
| Attachments | Chunked streaming AEAD |
| Sharing | HPKE, hybrid X25519 + ML-KEM-768 |
| Signatures | Ed25519 |
| Login | OPAQUE, SRP-6a as fallback |
Rules: versioned ciphertext headers; all metadata encrypted, including
URLs and titles; padded payload sizes; keys zeroised after use.

## 7. Turning on sync
1. User taps "Sync across devices" and picks Tessera Cloud or their own server.
2. Client generates the setup code, registers, and shows the Emergency Kit.
3. Existing local items upload as ciphertext. Nothing is re-encrypted.
4. New devices join by scanning a QR from a signed-in device.
5. Turning sync off keeps the full vault on the device and can delete
   the server copy.

Sync protocol: per-vault sequence numbers, pull "changes since N", push
with base revision. Conflicts merge per field on the client; the losing
value goes to item history, never dropped. Clients sign vault heads to
detect server rollback. Works fully offline.

## 8. Devices, entitlements and the cap
- A device is one enrolled install with its own signing key. A browser
  extension paired to a desktop app counts as that desktop.
- Free Cloud accounts sync 2 devices. Members have no cap.
- Swapping: remove a device any time; up to 2 swaps per 30 days on free.
- Enforcement is at enrolment on the server, using a signed entitlement
  token from the billing service.
- If membership lapses: nothing is locked or deleted. Every device keeps
  its full local vault and export. The user picks which 2 keep syncing.
- Self-hosted servers default to no cap; admins may set one.
- Membership can be bought on the website and redeemed in-app by code,
  so payment identity is separate from the vault account.

## 9. Plans
Prices are starting assumptions to test, not validated.
| Plan | Price | Includes |
| --- | --- | --- |
| Local | Free | Everything on one device, unlimited items, backups |
| Cloud Free | Free | 2 synced devices, unlimited items, passkeys, TOTP, autofill |
| Member | ~US$10/yr, regional pricing | Unlimited devices, 1 GB attachments, emergency access, breach monitoring, priority support |
| Family | ~US$25/yr, 6 people | Member for all, shared vaults, recovery contacts |
| Teams | ~US$2.50/user/month | Admin console, policies, groups, audit log, admin recovery |
| Self-host business | Annual licence | SSO, directory sync, support contract |

Always free: autofill with consent, passkeys, TOTP, generator, travel
mode, fill receipts, import, export, self-hosting for personal use.

Free-tier guard rails: 10,000 items and 25 MB per free account, email
verification, sign-up rate limits, no attachments on free.
Inactive free accounts get 24 months and three warnings before deletion.

Other income: sponsorships and open-source grants; paid setup and
support for self-hosters; managed dedicated instances for companies;
a limited "founding member" offer to fund the first audit.
Never: ads, data sales, affiliate deals.

## 10. Unlock and consent
- States: Locked, Unlocked. (Signed out exists only in sync mode.)
- Quick unlock: hardware key releases the Unlock Key after user
  verification. Android BiometricPrompt class 3; Windows Hello with TPM;
  Linux polkit/fprintd, TPM2 where present.
- App PIN: 6+ digits, combined with the hardware key; 5 failures require
  the vault password.
- Vault password is re-asked every 14 days so it is not forgotten.
| Level | When | Required |
| --- | --- | --- |
| Session | Opening the vault | Unlock |
| Per-fill (default) | Every autofill | Fresh PIN / fingerprint / Hello |
| Step-up | "Always ask" items, reveal, export, share | Biometric, no grace |
Prompt text: "Fill GitHub (aditi@…) into github.com?"

## 11. Autofill
| Platform | Mechanism | Consent |
| --- | --- | --- |
| Android 14+ | Credential Manager provider (passwords, passkeys) | BiometricPrompt |
| Android 8–13 | Autofill service with inline suggestions | Auth-required datasets |
| Windows / Linux browsers | Extension + desktop app over native messaging | Hello / PIN in the app |
| Windows 11 apps | Passkey plugin provider (needs MSIX packaging) | Windows Hello |
| Other desktop apps | Global hotkey quick-access, opt-in auto-type | Hello / PIN |
Rules: never fill on page load; exact-host match by default with a
per-item rule; HTTPS only; no cross-origin iframe fill without showing
the frame origin; picker never drawn in page-controlled DOM; Android
verifies caller signature and asset links; clipboard marked sensitive
and cleared after 30 s; lookalike-domain warning.

## 12. Items and features
Logins, passkeys, TOTP, cards, identities, notes, SSH keys, Wi-Fi,
documents. Password history (20), trash (30 days).
Stand-out features: fill receipts; account map (what depends on each
email, phone or 2FA device); recovery drill twice a year; restore a
server from any device; breach response checklist; recovery-code
tracking; duress PIN; expiry reminders; email alias providers.

## 13. Sharing (Family and Teams)
Vault keys wrapped to each member's public key; roles view/edit/manage;
key transparency log plus optional QR verification; removing a member
rotates the key and lists what they could see; expiring one-off links.

## 14. Server and self-hosting
One static binary and Docker image (amd64, arm64); SQLite by default;
browser setup wizard; built-in TLS via ACME; single-file backup and
verify commands; forward-only migrations with auto-backup; admin console
with no vault content; optional SMTP; Prometheus metrics.
Mobile wake-ups: optional project-run relay carrying content-free pings,
with polling as fallback.

## 15. UX
- Five screens: Unlock, Home (search first), Item, New, Settings.
- First run, under 60 seconds: choose a vault password, turn on
  biometrics, turn on autofill, import. No email asked.
- The sync offer appears once, after the first week, and in Settings.
  No nagging.
- Undo instead of confirmation dialogs. Errors say what happened and
  what to do next.
- WCAG 2.2 AA, right-to-left and localisation from the first release.
- Budgets: unlock < 1 s, search < 50 ms on 10,000 items, suggestions < 300 ms.

## 16. Distribution
| Target | Primary | Secondary |
| --- | --- | --- |
| Android | Google Play | F-Droid (FOSS flavor), signed APK on GitHub Releases |
| Windows | Microsoft Store (MSIX) | winget, signed installer |
| Linux | Flathub | AppImage, .deb/.rpm repo, community AUR/Nix |
| Extension | Chrome Web Store, Firefox Add-ons, Edge Add-ons | |
| Server | Container registry | Static binaries, .deb |
One CI pipeline builds, signs and publishes every artifact from a tag.
Builds are reproducible; update signatures are checked against a key
pinned in the app.

## 17. Community clients (iOS, macOS)
- Porting kit: API spec, UniFFI Swift bindings, shared test vectors,
  a conformance suite, UI guidelines.
- A client that passes conformance may use the "Tessera Community" mark.
- Store listings under the Tessera name must be published from the
  project's own developer account, with reproducible builds.

## 18. Licensing
- Server AGPL-3.0, clients GPL-3.0, core MPL-2.0 or GPL-3.0.
- Business-only features live in a separate directory under a
  commercial licence.
- Contributor agreement so dual licensing stays possible.
- "Tessera" name and logo are trademarks; forks must rename.

## 19. Security engineering and testing
Locked memory, no secrets in logs or crash dumps, screenshot blocking,
vetted and pinned dependencies, SBOM, no third-party SDKs, telemetry off
by default. Shared test vectors, property tests for merge convergence,
parser fuzzing, autofill regression corpus, upgrade tests from two
versions back, backup-restore tests in CI. External audit before sync
launches; published whitepaper; security.txt.

## 20. Build plan
| Phase | Ships | Exit criterion |
| --- | --- | --- |
| 1 | Core, Android local app with autofill | Daily-driver for 12 testers |
| 2 | Windows + Linux apps, browser extension | Consent-gated fill in browsers |
| 3 | Backups, device transfer, import/export | Vault survives a lost phone |
| 4 | Server, sync, self-hosting, web vault | Two devices sync offline edits |
| 5 | Audit, billing, device cap, Member plan | First paid member |
| 6 | Passkeys everywhere, sharing, Family, Teams | First team account |

## 21. Open questions
- Web vault trust: the server delivers the code it runs.
- Offline PIN attempt limits are software-enforced on most hardware.
- Linux biometrics are not hardware-bound without a TPM.
- In-app purchase rules per store and region.
- Trademark availability of the name.