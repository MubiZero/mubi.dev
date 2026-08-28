# Handover: mail for info@mubi.dev

Mail for `mubi.dev` runs on our own server, not on a hosted provider. This file records the parts
that are not obvious from the running system, so the next change does not start with an
archaeology session.

**No secrets live in this file.** Admin password, mailbox password, the Cloudflare API token and
the Coolify API token belong in a password manager. Everything below assumes you can look them up.

## What runs where

Stalwart Mail Server, one container, deployed through Coolify:

| | |
|---|---|
| Coolify project | `Mail` / environment `production` / service `mail-mubi-dev` |
| Server | the same host that runs Coolify and about twenty other projects |
| Admin panel | `https://mail.mubi.dev` (account `admin@mubi.dev`) |
| Mail ports | 25, 465, 587, 993, 995, 143, 110, 4190, published directly on the host |
| Web port | 8080, `expose` only, reachable solely from the Docker network |

Stalwart was chosen over Mailcow because Mailcow is fifteen or so containers that want ports 80 and
443 and their own ACME client. Those ports belong to the Coolify Traefik proxy that serves every
other project on this host, so Mailcow would have meant fighting the shared proxy. Stalwart is a
single container that needs neither.

## DNS is managed by Stalwart, not by hand

The `mubi.dev` zone in Cloudflare is under Stalwart's automatic DNS management. It publishes and
rotates SPF, DKIM, DMARC, MTA-STS, TLS-RPT and CAA records itself, using a zone-scoped Cloudflare
API token stored in the panel under `Network -> DNS`.

Editing those records in the Cloudflare dashboard is pointless: Stalwart overwrites them. Change
the setting in the panel instead and let it republish. DKIM keys rotate every 90 days, so the
selector names in DNS change over time by design.

The one record Stalwart does not manage is the PTR (reverse DNS) for the server address, which
points at `mail.mubi.dev`. That lives with the hosting provider. Without it outgoing mail lands in
spam almost everywhere, so if the server is ever migrated, set the PTR before anything else.

## Certificates use the DNS-01 challenge, and they have to

Stalwart holds its own Let's Encrypt certificate for `mail.mubi.dev` and renews it automatically.
The challenge type is DNS-01, configured under `TLS -> ACME`.

This is not a stylistic choice. HTTP-01 needs port 80 and TLS-ALPN-01 needs port 443; both are held
by the Traefik proxy, which also intercepts `/.well-known/acme-challenge/` for its own certificates.
DNS-01 sidesteps the conflict entirely by proving domain ownership through a TXT record.

Traefik separately holds its own certificate for the same hostname, for the web panel. The two do
not interfere: Traefik terminates TLS for HTTPS, Stalwart terminates TLS for IMAP and SMTP.

## Traefik routing

Routing is defined by container labels in the service's compose file, editable in Coolify under the
service's configuration.

- `mail.mubi.dev` on HTTP redirects to HTTPS; on HTTPS it proxies to Stalwart on port 8080.
- `mta-sts.mubi.dev` proxies to the same place. This one is easy to miss: Stalwart publishes
  MTA-STS DNS records automatically, but the policy file has to be fetchable over HTTPS at that
  hostname, and Traefik will not route a host it was never told about. Without this router the
  records advertise a policy that no sending server can retrieve.
- A `stripfwd` middleware deletes the incoming `Forwarded` header on both routers. See below.

## How client IPs are handled, and the trap in it

`Network -> Services -> HTTP` has `useXForwarded` enabled, so Stalwart reads the real client
address from the proxy headers instead of seeing every request as coming from Traefik. Without it,
brute-force protection would count all web traffic against a single internal address, which is both
useless and dangerous.

Enabling it opens a hole that has to be closed at the same time. Stalwart reads the RFC 7239
`Forwarded` header *before* `X-Forwarded-For`. Traefik overwrites `X-Forwarded-For` with the real
client address, but passes `Forwarded` through untouched, so anyone could set it and be treated as
any address they liked: evading their own ban, or getting an innocent address banned. The
`stripfwd` middleware removes that header at the proxy. If routing is ever rebuilt, keep it.

Do not put the Docker network into `Network -> General -> Proxy -> Trusted Networks`. That field
enables PROXY protocol parsing, which Traefik does not send for HTTP routers, and it breaks the web
listener.

## If the panel returns 502 for everyone

This has happened once and the cause is not guessable from the symptom.

Stalwart has built-in fail2ban. It bans an address for repeated authentication failures or for
probing paths that look like a port scan, and a `portScanning` ban has **no expiry**. Restarts,
redeploys and stop/start do not clear it, because it is stored in Stalwart's own data.

If the banned address happens to be the Traefik container, every user is locked out at once, since
all web traffic arrives from there. The connection is dropped during TCP accept, before any HTTP
parsing, so Traefik reports a 502 and no forwarded header can help.

Diagnosis and recovery, from a shell on the host (the host address is not the proxy address, so it
is not banned):

```bash
# confirm Stalwart itself is healthy: this should answer 302
IP=$(docker inspect stalwart-<service-uuid> \
     --format '{{range .NetworkSettings.Networks}}{{.IPAddress}}{{end}}')
curl -sS -o /dev/null -w '%{http_code}\n' http://$IP:8080/

# list bans, then destroy the offending entry by id
curl -sS -u 'admin@mubi.dev:<password>' -H 'Content-Type: application/json' \
  -d '{"using":["urn:ietf:params:jmap:core","urn:stalwart:jmap"],
       "methodCalls":[["x:BlockedIp/query",{},"0"]]}' http://$IP:8080/jmap/
```

Restart the service afterwards so the list reloads. Fixing the ban is the right move; adding the
Docker subnet to the allow list is not, because that disables brute-force protection for all web
traffic.

Stalwart's management API is JMAP, at `/jmap/`. Registry objects use an `x:` prefix and support
only `get`, `set` and `query`, for example `x:BlockedIp/query` or `x:AllowedIp/set`. Regular
mailbox objects use plain JMAP method names.

## Accounts

`admin@mubi.dev` administers the server. `info@mubi.dev` is a mailbox and should hold the `User`
role, not `Admin`: its password is typed into phones and mail clients, so it must not be able to
take over the server if it leaks. `postmaster@mubi.dev` exists as an alias because RFC 5321 requires
it and because the DMARC, TLS-RPT and CAA records point reports there.

## Client settings

IMAP `mail.mubi.dev:993` with SSL/TLS. SMTP `mail.mubi.dev:587` with STARTTLS, or 465 with SSL/TLS.
The username is the full address. The certificate is a real one, so any warning about it means
something is wrong rather than something to click through.

The email signature lives outside this repository; it references `public/favicon-180.png` served
from the site, so that file must keep its path.
