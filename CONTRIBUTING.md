# Contributing to CodeVerse

Thank you for helping improve CodeVerse. Contributions are welcome through GitHub issues and pull requests.

## Before You Start

- Read the [README](README.md) and [Code of Conduct](CODE_OF_CONDUCT.md).
- Search existing issues and pull requests before opening a new one.
- Open an issue first for large features, architectural changes, or breaking changes.
- Never commit passwords, tokens, API keys, database URLs, OAuth secrets, or real `.env` files.

## Development Workflow

1. Fork the repository.
2. Create a focused branch from `main`, for example `fix/login-timeout` or `feat/contest-filters`.
3. Install dependencies in both `backend/` and `frontend/`.
4. Copy the environment examples and use local credentials only.
5. Make a focused change with tests or validation where practical.
6. Run the checks listed below.
7. Push your branch to your fork and open a pull request against `main`.

The `main` branch is maintainer-protected. Direct commits are not accepted. Only the maintainer may approve and merge pull requests.

## Checks

From `frontend/`:

```bash
npm ci
npm run lint
npm run build
```

From `backend/`:

```bash
npm ci
node --check src/app.js
node --check src/server.js
```

If your change needs MongoDB, Redis, OAuth, email, or another external service, explain the setup and validation performed in the pull request. Do not use production services for development or CI.

## Pull Requests

A good pull request should:

- Explain the user-facing or maintenance problem being solved.
- Keep unrelated refactors out of the change.
- Include screenshots or short recordings for UI changes when useful.
- Update documentation and safe environment examples when configuration changes.
- Describe tests and checks that were run.
- Call out migrations, breaking changes, security implications, and deployment considerations.

Pull requests require maintainer review. Review comments and required CI checks must be resolved before merge.

## Security Issues

Do not report vulnerabilities in a public issue. Follow [SECURITY.md](SECURITY.md) instead.

## License

By contributing, you agree that your contributions are provided under the [MIT License](LICENSE).
