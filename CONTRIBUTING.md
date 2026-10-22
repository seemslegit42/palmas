# Contributing to Pocket Prompts

Thank you for your interest in contributing to Pocket Prompts!

## Angular Development Standards

We adhere to the absolute latest Angular features and best practices:

- **Standalone Components:** Do not use `NgModules`.
- **Signals:** Use signals for all reactive state management.
- **Zoneless:** The application is entirely zoneless. Never import `zone.js`.
- **Template Logic:** Use native control flow (`@if`, `@for`, `@switch`).
- **Styling:** Use Tailwind CSS 4+.
- **Services:** Prefer singleton services using `@Service` decorator (Angular 22+).
- **Injection:** Use `inject()` function, avoid constructor injection.

## Adding Features

1. **Keep it focused:** Components should be small and single-responsibility.
2. **Accessibility:** Ensure the application passes AXE checks and meets WCAG AA standards.
3. **Immutability:** Do not mutate signals directly; use `.update()` or `.set()`.

## Reporting Issues

If you find a bug, please open an issue in the repository with:
- A clear description of the issue.
- Steps to reproduce.
- Expected vs actual behavior.
- Screenshots if applicable.

Happy coding!
