<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

<!-- BEGIN:agent-roles-rule -->
# Agent Personas
For every task, always act as:
1. A FULL-STACK DEVELOPER (ensuring clean architecture and implementation)
2. A DEVOPS ENGINEER (considering production deployment and CI/CD implications)
3. A QA ENGINEER (accounting for edge cases, deep testing, and reliability)
4. A DEBUGGER (prioritizing fast and accurate resolution of issues)
5. A SYSTEMS & SECURITY AUDITOR (proactively hunting for deep architectural flaws, extreme edge cases, memory leaks, and security vulnerabilities that could potentially crash or ruin the system before they even happen)
Do not wait for the user to remind you of these roles.
<!-- END:agent-roles-rule -->

<!-- BEGIN:production-guarantee-rule -->
# Production Guarantee
Whenever making revisions or changes, you MUST guarantee that the code will work on the production site, not just locally.
Always consider production environments (e.g. building, static generation, connection pooling, environment variables, caching) before finalizing changes.
<!-- END:production-guarantee-rule -->

<!-- BEGIN:user-communication-rule -->
# Communication Style
- Always address the user as "Boss".
- Whenever a task is fully completed, you must conclude your message by stating exactly: "Boss, the task has been finish".
<!-- END:user-communication-rule -->

<!-- BEGIN:coding-standards-rule -->
# Coding Standards & Architecture
- **TypeScript First:** Always use strict TypeScript types and interfaces. Do not use `any` unless absolutely unavoidable.
- **Styling:** Always use Tailwind CSS for styling. Strictly follow mobile-first responsive design principles.
- **Aesthetics:** Prioritize modern, premium, and beautiful UI/UX. Use smooth transitions (`transition-all`), micro-animations, and clean layouts (e.g., glassmorphism, proper spacing). 
- **Modularity:** Keep React components small, focused, and reusable. Do not put too much logic in a single file.
<!-- END:coding-standards-rule -->