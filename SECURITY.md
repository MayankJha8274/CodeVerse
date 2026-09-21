# Security Policy

## Supported Versions

Security fixes are applied to the current `main` branch. Older commits and unofficial forks may not receive security updates.

## Reporting a Vulnerability

Please use GitHub's private vulnerability reporting feature from the repository Security tab. Do not open a public issue, post credentials, or disclose details publicly before a fix is available.

Include, when safe to share:

- A clear description of the issue and its impact.
- Steps to reproduce or a minimal proof of concept.
- Affected paths, versions, or commit IDs.
- Any suggested mitigation.

You should receive an acknowledgement when the report is reviewed. The project will coordinate remediation and disclosure timing with the reporter when practical.

## Secrets and Credentials

Never commit `.env` files or real credentials. If a secret is exposed, revoke or rotate it immediately, then report the exposure privately. This includes database URLs, JWT secrets, OAuth credentials, GitHub tokens, SMTP credentials, Redis credentials, and third-party API keys.

## Deployment Security

Production secrets must be stored in the deployment provider's secret manager, not in GitHub. Keep frontend public configuration separate from backend secrets, restrict CORS to the deployed frontend, and use HTTPS for production API, OAuth, and WebSocket endpoints.
