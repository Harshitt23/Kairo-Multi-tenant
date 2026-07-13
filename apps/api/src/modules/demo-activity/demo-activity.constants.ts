export const DEMO_ACTIVITY_QUEUE = 'demo-activity';

// Fixed jobId so re-registering the repeatable job on every server boot /
// hot-reload is a no-op instead of stacking duplicate schedules.
export const DEMO_ACTIVITY_REPEAT_JOB_ID = 'demo-activity-tick';
