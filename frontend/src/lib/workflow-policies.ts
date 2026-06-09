export type WorkflowPolicy = { name: string; role: string; api: string; writes: string[]; reads: string[]; queues: string[]; audits: string[] };
export const workflowPolicies: WorkflowPolicy[] = [
  { name: 'parent-enroll-child', role: 'parent', api: '/api/mearn/payment', reads: ['classes','learner_profiles','parent_children'], writes: ['transactions','mpesa_pending','enrollments'], queues: ['mearn.process_payment','notify.payment_started'], audits: ['mearn_audit','audit_logs'] },
  { name: 'teacher-publish-quiz', role: 'teacher', api: '/api/lms/quizzes', reads: ['classes','teacher_profiles'], writes: ['quizzes','quiz_questions','lms_audit'], queues: ['notify.assignment_created'], audits: ['lms_audit'] },
  { name: 'learner-submit-assignment', role: 'learner', api: '/api/lms/submissions', reads: ['assignments','enrollments'], writes: ['assignment_submissions','progress_snapshots'], queues: ['gamfy.award_points','notify.submission_received'], audits: ['lms_audit'] },
  { name: 'admin-verify-teacher', role: 'admin', api: '/api/admin/users/teachers', reads: ['teacher_profiles','certificates_pending','document_hashes'], writes: ['teacher_profiles','certificates_pending','audit_logs'], queues: ['notify.teacher_verified'], audits: ['audit_logs'] },
  { name: 'classroom-chat-message', role: 'learner', api: '/api/classroom/chat', reads: ['room_participants','user_restrictions'], writes: ['room_chat','flag_records'], queues: ['flag.scan_chat','notify.strike_warning'], audits: ['classroom_audit','flag_records'] }
];
export function policyFor(name: string) { const policy = workflowPolicies.find((item) => item.name === name); if (!policy) throw new Error(`Unknown workflow policy: ${name}`); return policy; }
export function tablesForRole(role: string) { return Array.from(new Set(workflowPolicies.filter((item) => item.role === role).flatMap((item) => [...item.reads, ...item.writes]))).sort(); }
