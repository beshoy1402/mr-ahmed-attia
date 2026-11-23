# Release Readiness Checklist

## Public website
- [x] Production deployment reports READY.
- [x] Responsive landing page and bilingual switch are present.
- [ ] Manual QA on current iOS Safari, Android Chrome, tablet, and desktop.
- [ ] Confirm public contact details, approved biography, course fees, and schedule with teacher.
- [ ] Add custom domain and verified contact channels if required.

## Firebase and application
- [ ] Correct Firebase project confirmed.
- [ ] Development and staging projects provisioned.
- [ ] Web app registered and environment configured.
- [ ] Authentication and verification flows tested.
- [ ] Role grants assigned only by trusted server workflows.
- [ ] Firestore and Storage rules tests pass.
- [ ] App Check configured and monitored.
- [ ] Backup and restore tested.
- [ ] Audit logs and operational alerts active.

## Learning workflows
- [ ] Course and group creation.
- [ ] Student registration, approval, invitation and enrollment.
- [ ] Parent linking and scoped access.
- [ ] Lesson publishing and progress.
- [ ] Question bank manual authoring and file import.
- [ ] Exam authoring, delivery, autosave and grading.
- [ ] Homework submissions and feedback.
- [ ] Attendance and corrections.

## AI and external integrations
- [ ] AI providers and budgets approved.
- [ ] Approved-source retrieval permissions tested.
- [ ] Official vs AI-generated provenance visible.
- [ ] Teacher approval workflow enforced per course/content type.
- [ ] AI uncertainty and teacher escalation tested.
- [ ] Payment, video, live-class, email, SMS and WhatsApp providers approved and verified.

## Go-live gate
Do not onboard real students or collect real payments until identity, authorization, rules, backup/restore, privacy, and critical learning/payment workflows have been tested in staging.
