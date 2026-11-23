# First-pass LMS Data Model

This document describes logical entities, not final Firestore collection paths. Collection names and indexes must be finalized against actual queries and rules tests.

## Identity and authorization
- UserProfile: display name, verified contact metadata, locale, account state.
- RoleGrant: role, scope type, scope ID, grantor, timestamps, expiry/revocation.
- ParentStudentLink: parent ID, student ID, approval state, relationship, audit metadata.
- Invitation: code hash, permitted role, course/group scope, expiry, use limit, status.
- StaffAssignment: staff ID, center/course/group scope, permissions, active state.

## Organization
- Center: name, address, timezone, status.
- Room: center ID, name, capacity, status.
- ScheduleSession: course/group, delivery method, start/end, room or meeting reference.

## Learning
- Course: title, subject, language, teacher owner, publication state, access rules.
- Group: course ID, center ID, schedule, assigned staff.
- Enrollment: student ID, course/group ID, approval state, entitlement state, dates.
- Unit, Lesson, LessonResource, LessonProgress: ordered learning content and progress.
- KnowledgeSource: course scope, source type, approval state, provenance, storage reference.

## Question bank and assessment
- QuestionBank: owner/course scope, title, status.
- Passage: source attribution, text/resource references, language, approval state.
- Question: passage reference, prompt, options, answer key, explanation, domain, skill, difficulty, provenance, version, approval state.
- ImportJob: uploader, source file, extraction status, confidence/errors, review history, destination.
- Exam: blueprint, modules, questions, schedule, security policy, publication state.
- ExamAttempt: student, exam, issued token reference, state, timestamps, autosave metadata.
- Answer: attempt, question, response, correctness, timing.
- GradeRecord: result, grading source, reviewer, publication state, audit references.

## Operations
- Homework, Submission, Rubric, Feedback.
- AttendanceSession, AttendanceRecord, CorrectionRequest.
- Invoice, PaymentEvent, Entitlement, Refund.
- Conversation, Participant, Message, SupportTicket, Notification.
- AIProviderConfig (secret references only), ModelRoute, AIUsage, AIReview, AIConversation.
- AuditEvent, FeatureFlag, IntegrationHealth, BackupRecord.

## Mandatory record metadata

Where relevant, records should include:
- createdAt, createdBy;
- updatedAt, updatedBy;
- owning course/group/center scope;
- publication/approval state;
- version or immutable history reference;
- deletion/archive state and reason;
- provenance and source attribution for educational content.

## Non-negotiable invariants

- A user cannot assign their own role or widen their own scope.
- Parent access requires an active, approved parent-child relationship.
- Student access requires approved account, valid enrollment, released content, and active entitlement where payment applies.
- A client cannot mark a payment as paid or grant paid entitlement.
- AI retrieval must apply the same access scopes as the source records.
- AI-generated questions and explanations retain explicit AI provenance and approval state.
- Exam answers and grades are protected from unauthorized modification.
- Sensitive changes generate audit events.
