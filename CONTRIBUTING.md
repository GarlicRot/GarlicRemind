# Contributing to GarlicRemind

First off, thanks for considering contributing to GarlicRemind! 🎉  
Whether it's a bug fix, feature suggestion, documentation improvement, or just an idea — you're welcome here.

---

## Getting Started

1. **Fork** the repository and clone your fork:
   ```bash
   git clone https://github.com/YOUR_USERNAME/GarlicRemind.git
   cd GarlicRemind
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up your `.env` file**:
   Create a `.env` file based on the template below:

   ```env
   # Discord Bot Configuration
   DISCORD_TOKEN=
   CLIENT_ID=
   GUILD_ID=

   # Firebase Admin SDK Credentials
   FIREBASE_TYPE=
   FIREBASE_PROJECT_ID=
   FIREBASE_PRIVATE_KEY_ID=
   FIREBASE_PRIVATE_KEY=
   FIREBASE_CLIENT_EMAIL=
   FIREBASE_CLIENT_ID=
   FIREBASE_UNIVERSE_DOMAIN=
   ```

---

## Project Structure

```
src/
  commands/         → Slash command definitions
  events/           → Discord event handlers
  utils/            → Utility and helper functions
  firebase.js       → Firebase Admin SDK setup
  index.js          → Main bot entry point
.github/
  workflows/        → CI workflows
```

---

## Making Contributions

### Bug Fixes
- Check for open issues or create one first.
- Include a clear description of the problem and how you fixed it.

### Features
- Create a detailed issue first so we can discuss the idea.
- Keep features focused and test thoroughly before submitting.

### Code Style
- Use `prettier` for formatting and `eslint` for linting.
- Keep commit messages clear and consistent.

---

## Testing

If you’re adding logic, try to include usage examples or test coverage.  
Future CI may include test suites to validate these changes.

---

## Submitting Pull Requests

- Open a PR to the `main` branch.
- Include a clear title and description.
- Link the issue you're resolving (if applicable).
- Use draft PRs if your work is still in progress.

---

## Community Guidelines

- Be respectful and open to feedback.
- Follow the [Code of Conduct](https://github.com/GarlicRot/GarlicRemind/blob/main/CODE_OF_CONDUCT.md) (if present).
- We're here to build something cool and useful together!

---

Thanks again!  
— GarlicRot 🧄
