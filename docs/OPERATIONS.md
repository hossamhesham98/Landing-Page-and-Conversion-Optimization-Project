# SITEYFY and DoCloroo source snapshot

The application source was exported read-only from the running project on 3 November 2026 (Africa/Cairo). The root README preserves the supplied Docloroo project brief, team, five-week plan and KPIs.

- `storefront/`: DoCloroo Next.js 15.5.28 storefront, approved V7 design and current image gallery.
- `admin/`: independent SITEYFY Next.js dashboard.
- `medusa/`: Medusa 2.22.2 workspace with the project's commerce, COD, OTP, SMTP notifications, CMS and tracking integrations; pnpm 10.11.1.
- `compose.yaml`: exported project-only service definition, including PostgreSQL, Redis, Medusa server and worker, storefront and admin. Named volumes preserve the database and uploads. Its image tags refer to locally built images, not published Docker Hub images.
- `Dockerfile.medusa` and `Dockerfile.next`: project build definitions.
- `.env.example`: placeholder configuration only. Supply actual credentials privately.

## Current public services

- Store: https://docloroo.com
- SITEYFY: https://admin.docloroo.com
- API: https://api.docloroo.com

## Deployment boundaries

This is a source snapshot, not a production database backup. Products, approved stock, published CMS content, customers, orders, notification configuration and uploaded media are stored in Medusa/PostgreSQL and persistent uploads. They are not automatically recreated by cloning this repository. Approved public product presentation and local copies of its images are recorded in `catalog-presentation.json`; this is documentation, not an automatic seed or a live-data restore.

The existing server uses an HTTPS reverse proxy in front of loopback application ports. Proxy configuration, DNS, TLS certificates, server access keys and production secrets are not included here. Preserve the existing server infrastructure when publishing code updates. Do not run initialization, seeds, migrations or volume deletion merely to synchronize source with GitHub.

For a separate new server, fill `.env` privately, build the three application images with the matching tags in Compose, provision Medusa deliberately, configure its publishable key and approved product data, then configure HTTPS. Native migrations and initialization are explicit operator steps, never part of normal application startup. Newly provisioned environments must keep sales and SMTP disabled until their real configuration and inventory are approved. This source snapshot does not switch any live settings.

The supplied Compose file reflects the deployed application's enabled sale flags; review and disable those flags before using it for a new environment. The sample environment's disabled flags do not override literal values in the exported Compose file.

## Checks for this synchronization

The source archive was verified, changes were compared with the previous GitHub commit, the README was checked against every non-empty paragraph and table cell in the supplied Word file, and publication files were scanned for private keys, credentials, environment files, database exports and runtime artifacts. This GitHub synchronization does not claim a new application build or full regression suite, and does not modify the live server.
