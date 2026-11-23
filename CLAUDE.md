# Claude Code Instructions — Mr. Ahmed Attia LMS

You are working in the repository for Mr. Ahmed Attia's production SAT Reading & Writing LMS.

## Read first
- `README.md`
- `REQUIREMENTS.md`
- `ARCHITECTURE.md`
- `SECURITY.md`
- `DEPLOYMENT.md`

## Working principles
- Inspect the actual codebase before editing.
- Preserve useful existing work.
- Build usable, accessible, mobile-first interfaces.
- Do not claim a feature works unless its full workflow is implemented and tested.
- Never replace real functionality with fake buttons, hard-coded demo data, local-only persistence, or simulated integrations without clearly labelling a development-only fixture.
- Never expose secrets or ask the owner to paste secrets into chat.
- Do not weaken security rules to make a screen work.
- Do not invent official College Board questions, proprietary adaptive algorithms, or scoring formulas.
- AI must distinguish official material, teacher-authored content, third-party sources, and original AI-generated practice.
- AI must disclose general-knowledge use when required and admit uncertainty.
- Apply permissions before AI retrieval and before server-side data access.
- Respect the role/scope model in the architecture document.
- Keep payment, grade, attendance, enrollment, and entitlement decisions on trusted server-side code.
- Do not automatically publish AI-generated educational content when the configured course/content policy requires review.
- All destructive operations require explicit confirmation and audit records.
- Keep documentation and the requirements register updated as decisions change.

## User experience
- Make common student tasks obvious and easy on mobile.
- Use clear language, short forms, helpful validation, visible progress, accessible contrast, and clear empty/loading/error/success states.
- Keep navigation consistent across roles while showing only permitted actions.
- Support English LTR and Arabic RTL.
- Do not overcrowd dashboards; prioritize the user's next action.
- Avoid decorative controls that do not work.

## Engineering workflow
1. Inspect current files and dependencies.
2. Explain the implementation slice and risks briefly.
3. Implement in small, reviewable changes.
4. Add tests for business logic and permissions.
5. Run available checks and report exact outcomes.
6. Update docs and requirements status.
7. Never deploy production without checking the intended project/environment and verifying release readiness.

## First implementation priorities
1. Audit the current static landing page and correct the SAT Reading & Writing positioning.
2. Select and establish the application framework without unnecessary migration.
3. Create the design system, navigation, accessibility, and responsive role-aware shell.
4. Establish Firebase development/staging/production configuration.
5. Implement authentication and server-enforced role/scope authorization.
6. Add course/enrollment and question-bank foundations.
7. Continue through exams, homework, attendance, AI, payments, communications, analytics, and operations in verified slices.

## Pending owner decisions
- Detailed analytics selection is still pending.
- Payment gateway and merchant account are not selected.
- AI providers/models and budget are not finalized.
- Video hosting/streaming provider is not selected.
- Email/SMS/WhatsApp vendors are not selected.
- Production Firebase/Vercel project credentials and configuration must be connected by the owner through secure provider interfaces.

Do not block all progress on these external decisions: build provider-neutral interfaces and complete independent foundations first. Do not fake provider-backed functionality.
