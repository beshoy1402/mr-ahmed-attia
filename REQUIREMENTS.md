# Product Requirements Register

Status values: **Confirmed**, **Pending decision**, **Blocked by external setup**, **Implemented**, **Verified**.

## Product
- **Confirmed:** Mr. Ahmed Attia SAT Reading & Writing LMS.
- **Confirmed:** SAT Reading & Writing is the initial subject.
- **Confirmed:** Architecture must allow additional subjects later.
- **Confirmed:** Full LMS, not merely a teacher-management dashboard.

## Roles
- **Confirmed:** Super Admin/Owner, Main Teacher, Additional Teacher, Assistant, Center Manager, Accountant, Support Staff, Student, Parent, Developer.
- **Confirmed:** Role-based, scope-aware permissions; Developer does not receive automatic access to private educational or financial records.
- **Confirmed:** Parents can be linked to multiple children; both parents may be linked to the same child.
- **Confirmed:** Parent access is restricted to explicitly linked and approved children.

## Registration and identity
- **Confirmed:** Student registration requests require approval; staff can create accounts; invitation codes/links supported.
- **Confirmed:** Parent accounts require approval and child linking.
- **Confirmed:** Email/password, phone/password, username/password, passwordless OTP, and admin-created temporary-password accounts are required, subject to role policy.
- **Confirmed:** Email/phone verification, 2FA, session management, suspicious-login alerts, rate limits, lockouts, and sensitive-action verification.
- **Pending decision:** Exact identity provider configuration, OTP/email delivery vendors, and production account recovery policy.

## Learning experience
- **Confirmed:** Student dashboard includes courses, lessons, live classes, exams, homework, grades, attendance, payments, schedule, messages, AI tutor, resources, certificates, goals, notes, bookmarks, and mistake notebook.
- **Confirmed:** Parent dashboard includes approved child progress, grades, results, attendance, homework, payments, schedules, notifications, messaging, and reports.
- **Confirmed:** Mobile-first responsive web and installable PWA; native mobile apps are not in initial scope.
- **Confirmed:** Course content supports units, chapters, sections, lessons, video, text, PDFs, attachments, quizzes, homework, live classes, resources, prerequisites, drip release, completion tracking, comments, versioning, templates, and bilingual content.
- **Confirmed:** Protected content requires approved account, enrollment, and configured payment/access eligibility.
- **Confirmed:** Teaching methods include recorded lessons, live online classes, physical classes, private sessions, and hybrid learning.

## Question bank and imports
- **Confirmed:** Manual authoring, passage-linked questions, options, answer keys, explanations, SAT domain/skill taxonomy, difficulty, tags, search, version history, duplicate detection.
- **Confirmed:** PDF/Word/Excel file import with extraction of passages, questions, options, answer keys, explanations, images, and diagrams where technically possible.
- **Confirmed:** Import preview/edit/review, destination course and section selection, taxonomy assignment, duplicate detection, uncertainty/error flags, teacher approval, retained original file, and import history.
- **Confirmed:** Extraction must never silently invent missing answers or explanations.
- **Confirmed:** SAT domains: Information and Ideas; Craft and Structure; Expression of Ideas; Standard English Conventions.

## Exams and assessment
- **Confirmed:** Manual/automatic exam builder, Module 1/Module 2 structures, full-length simulations, mini-tests, skill practice, adaptive-style practice, scheduling, group/individual assignment, retake limits, templates, teacher preview.
- **Confirmed:** Exam security includes strict timers, autosave/recovery, attempt limits, configurable navigation, randomization, unique access tokens, accessibility accommodations, controlled answer release, activity logs, optional identity/webcam checks with consent, and suspicious-activity review.
- **Confirmed:** Suspicious activity is a review signal, not proof of cheating.
- **Confirmed:** Automatic and manual grading, raw scores, accuracy, domain/skill/time/difficulty analysis, history, comparison, feedback, reports, mistake notebook.
- **Confirmed:** Any SAT score prediction must be clearly labelled unofficial and must not claim exact College Board equivalence or use invented scoring rules.

## Homework and attendance
- **Confirmed:** PDF and online assignments, file submissions, question-bank assignments, individual/group/recurring work, deadlines, late work, extensions, automatic/manual grading, rubrics, feedback, resubmissions, teacher-reviewed AI suggestions, similarity flags for review, analytics, reminders, parent visibility.
- **Confirmed:** Manual, QR, code, online, and supported meeting-provider attendance; check-in/out, late/early, excused/unexcused, private sessions, center/room scope, parent alerts, correction requests, reports, audit trail.
- **Confirmed:** Staff can manage only assigned scopes; corrections are auditable.

## AI system
- **Confirmed:** Separate Student AI Tutor and Teacher AI Assistant.
- **Confirmed:** Socratic teaching, progressive hints, step-by-step explanations, grammar, vocabulary, passage analysis, SAT strategies, original practice generation, personalized learning, mistake patterns, study plans, voice, Arabic/English, citations, teacher customization, and teacher escalation.
- **Confirmed:** AI must distinguish official College Board material from teacher-created, third-party, and original AI-generated content.
- **Confirmed:** AI must admit uncertainty and must not fabricate explanations.
- **Confirmed:** Knowledge sources include approved materials, question bank, uploaded files, lesson transcripts/notes, official public College Board resources, approved websites, student-specific history, teacher instructions, general knowledge, and isolated course/group/teacher knowledge bases.
- **Confirmed:** Approved materials have priority; general knowledge use must be disclosed; source references shown when available; access filtering occurs before retrieval.
- **Confirmed:** AI content approval is configurable per course and content type, with drafts, teacher review, approval/rejection, editing, version history, audit logs, and rules for question bank/exam insertion.
- **Confirmed:** Provider options include Gemini, OpenAI, Anthropic, NVIDIA API integrations, MiniMax, Qwen, Llama-based models, and other compatible providers.
- **Confirmed:** Multi-provider routing, failover, task-specific model selection, usage/budget controls, monitoring, editable prompts, privacy controls, and feature-level permissions.
- **Confirmed:** API credentials are server-side secrets and must never be exposed to browsers or ordinary staff.
- **Pending decision:** Final provider/model choices, API accounts, privacy/data-processing settings, and AI budget.
- **Pending decision:** Detailed analytics feature selection (the owner has not yet answered the analytics requirements question).

## Payments
- **Confirmed:** Manual and online payment records, subscriptions, per-course/per-session payments, packages, discounts, promo codes, installments, receipts, balances/debts, parent payments, center-specific records, teacher financial dashboard, configurable rules.
- **Confirmed:** Payment events must be verified server-side; transaction history must be auditable.
- **Blocked by external setup:** Gateway selection, merchant accounts, API credentials, webhook setup, fees, and legal/compliance review.

## Live classes and video
- **Confirmed:** Zoom, Google Meet, Microsoft Teams, built-in classroom, external meeting links.
- **Confirmed:** Google Classroom is a separate classroom/assignment integration, not a live-meeting provider.
- **Confirmed:** Provider-dependent features must only be advertised when actually supported and authorized.
- **Confirmed:** Video sources include direct uploads, YouTube, Vimeo, and external links; progress save/resume, completion tracking, analytics, attachments, access controls.
- **Blocked by external setup:** Provider accounts, OAuth/API approvals, recording permissions, and video hosting/streaming vendor choice.

## Communications and notifications
- **Confirmed:** Private and group messaging, student/parent/teacher conversations, announcements, files, voice/video where supported, live support, tickets, AI support chatbot, moderation/reporting/blocking, read receipts, search, assignment, working hours, auto replies.
- **Confirmed:** In-app, PWA push, email, WhatsApp, SMS, event notifications, digests, user preferences, bilingual templates.
- **Blocked by external setup:** Email, SMS, WhatsApp provider accounts and templates.

## Public website and administration
- **Confirmed:** Bilingual public site, course catalog, about, pricing, testimonials, success stories with consent, blog, FAQ, gallery, contact, banners, SEO, page builder, Arabic RTL and English LTR.
- **Confirmed:** Developer controls overall website design/structure; teachers manage educational content and permitted promotional details.
- **Confirmed:** Teacher dashboard includes students, parents, courses, groups, exams, bank, homework, attendance, analytics, payments, centers, schedules, staff, reports, public content, settings, audit logs.
- **Confirmed:** Developer dashboard includes Firebase, API control, AI providers/models, usage/cost, logs, security, backups, webhooks, health, database, storage, deployments, feature controls, maintenance mode, developer audit/support, and limits. Extensible for future modules.

## Analytics
- **Pending decision:** Owner's detailed selection for score progression, domain/skill insights, time, accuracy, repeated mistakes, engagement, homework, exam comparisons, AI recommendations, at-risk alerts, class/group/center comparisons, parent reports, goals, exports, and custom dashboards.
- **Confirmed:** Visibility must be configurable; unauthorized users must not see student performance.

## Platform security and operations
- **Confirmed:** Least privilege, Firestore/Storage rules, server-side validation, App Check where appropriate, audit logs, backup/recovery, environment separation, monitoring, rate limiting, file validation, secure webhooks, and no secrets in Git.
- **Confirmed:** Production features require UI, backend persistence, permissions, validation, failure handling, responsive behavior, audit controls, and tests.
- **Blocked by external setup:** Firebase project access/configuration, hosting project, domains, service credentials, email/OTP providers, payment provider accounts, and third-party OAuth/API approvals.
