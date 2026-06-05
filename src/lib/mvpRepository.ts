import { supabase, isSupabaseConfigured } from './supabase';
import {
  auditLogs,
  buildings,
  committeeMembers,
  company,
  complianceItems,
  contractors,
  documents,
  facilityBookings,
  incidents,
  maintenanceRequests,
  messages,
  motions,
  notices,
  notifications,
  packages,
  people,
  projects,
  renovations,
  reportIssues,
  staff,
  testAccounts
} from '../data';
import type { MaintenanceRequest, Notice, Priority, ReportIssue, Role, SimpleRecord, TestAccount } from '../data';

export type MvpData = {
  notices: Notice[];
  reportIssues: ReportIssue[];
  maintenanceRequests: MaintenanceRequest[];
  messages: SimpleRecord[];
  documents: SimpleRecord[];
  notifications: SimpleRecord[];
  auditLogs: SimpleRecord[];
  motions: SimpleRecord[];
  facilityBookings: SimpleRecord[];
  renovations: SimpleRecord[];
  packages: SimpleRecord[];
  incidents: SimpleRecord[];
};

export type MvpActionResult = {
  ok: boolean;
  message: string;
};

const fallbackData: MvpData = {
  notices,
  reportIssues,
  maintenanceRequests,
  messages,
  documents,
  notifications,
  auditLogs,
  motions,
  facilityBookings,
  renovations,
  packages,
  incidents
};

export async function loadMvpData(account: TestAccount | null, role: Role): Promise<MvpData> {
  if (!isSupabaseConfigured || !supabase || !account) return fallbackData;

  const user = await findUserByEmail(account.email);
  if (!user) return fallbackData;

  if (role === 'contractor') {
    return loadContractorMvpData(account, user.id);
  }

  const allowedBuildingIds = await getAllowedBuildingIds(user.id, role);
  const companyId = user.company_id ?? company.id;
  const hasBuildingScope = allowedBuildingIds.length > 0;

  const [noticeRows, issueRows, maintenanceRows, messageRows, documentRows, notificationRows, auditRows, motionRows] = await Promise.all([
    hasBuildingScope ? supabase.from('notices').select('*').in('building_id', allowedBuildingIds) : emptyResult(),
    hasBuildingScope ? supabase.from('report_issues').select('*').in('building_id', allowedBuildingIds) : emptyResult(),
    hasBuildingScope ? supabase.from('maintenance_requests').select('*').in('building_id', allowedBuildingIds) : emptyResult(),
    hasBuildingScope
      ? supabase.from('messages').select('*').or(`building_id.in.(${allowedBuildingIds.join(',')}),recipient_id.eq.${user.id},sender_id.eq.${user.id}`)
      : supabase.from('messages').select('*').or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`),
    hasBuildingScope ? supabase.from('documents').select('*').in('building_id', allowedBuildingIds) : emptyResult(),
    supabase.from('notifications').select('*').eq('user_id', user.id),
    supabase.from('audit_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(20),
    hasBuildingScope ? supabase.from('committee_motions').select('*').in('building_id', allowedBuildingIds) : emptyResult()
  ]);

  if (noticeRows.error || issueRows.error || maintenanceRows.error) return fallbackData;

  return {
    notices: (noticeRows.data ?? []).map(mapNotice),
    reportIssues: (issueRows.data ?? []).map(mapIssue),
    maintenanceRequests: (maintenanceRows.data ?? []).map(mapMaintenance),
    messages: (messageRows.data ?? []).map((row) => mapSimple(row, row.subject ?? 'Message', row.channel ?? 'Message')),
    documents: (documentRows.data ?? []).map((row) => mapSimple(row, row.title, row.category)),
    notifications: (notificationRows.data ?? []).map((row) => mapSimple(row, row.title, row.event_type)),
    auditLogs: (auditRows.data ?? []).map((row) => mapSimple(row, row.action, row.entity_type)),
    motions: (motionRows.data ?? []).map((row) => mapSimple(row, row.title, 'Committee motion')),
    facilityBookings,
    renovations,
    packages,
    incidents
  };
}

async function loadContractorMvpData(account: TestAccount, userId: string): Promise<MvpData> {
  if (!supabase) return fallbackData;
  const contractor = await supabase.from('contractors').select('id').eq('email', account.email).maybeSingle();
  if (!contractor.data) return fallbackData;
  const workOrders = await supabase
    .from('work_orders')
    .select('*, maintenance_requests(*)')
    .eq('contractor_id', contractor.data.id);
  const [messagesForContractor, notificationsForContractor] = await Promise.all([
    supabase.from('messages').select('*').or(`recipient_id.eq.${userId},sender_id.eq.${userId}`),
    supabase.from('notifications').select('*').eq('user_id', userId)
  ]);

  return {
    notices: [],
    reportIssues: [],
    maintenanceRequests: (workOrders.data ?? []).map((row) => mapMaintenance({
      ...(row.maintenance_requests ?? {}),
      id: row.maintenance_request_id,
      building_id: row.building_id,
      contractor_id: row.contractor_id,
      status: row.status
    })),
    messages: (messagesForContractor.data ?? []).map((row) => mapSimple(row, row.subject ?? 'Message', row.channel ?? 'Message')),
    documents: [],
    notifications: (notificationsForContractor.data ?? []).map((row) => mapSimple(row, row.title, row.event_type)),
    auditLogs: [],
    motions: [],
    facilityBookings,
    renovations,
    packages,
    incidents
  };
}

export async function signInTestAccount(account: TestAccount): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: true, message: 'Using local seeded test account. Configure Supabase env vars to use Supabase Auth.' };
  }

  const password = import.meta.env.VITE_SUPABASE_TEST_PASSWORD as string | undefined;
  if (!password) {
    return { ok: true, message: 'Supabase is configured, but no test password is set. Using seeded profile mode.' };
  }

  const result = await supabase.auth.signInWithPassword({ email: account.email, password });
  if (result.error) {
    return { ok: false, message: result.error.message };
  }

  return { ok: true, message: 'Signed in with Supabase Auth.' };
}

export async function createResidentIssue(account: TestAccount | null, payload?: Partial<ReportIssue>): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: true, message: 'Issue submitted.' };

  const user = await findUserByEmail(account.email);
  const membership = user ? await firstMembership(user.id) : null;
  if (!user || !membership) return { ok: false, message: 'No Supabase user/building membership found for this resident.' };

  const title = payload?.title ?? 'Resident reported issue';
  const severity = payload?.severity ?? 'Medium';
  const category = payload?.category ?? 'Maintenance';

  const insertIssue = await supabase.from('report_issues').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    lot_id: membership.lot_id,
    resident_id: user.id,
    category,
    severity,
    title,
    description: 'Reported from StrataOS resident portal.',
    routing_outcome: severity === 'Emergency' ? 'Maintenance request + incident' : 'Maintenance request',
    status: 'Triage'
  }).select('id').single();

  if (insertIssue.error) return { ok: false, message: insertIssue.error.message };

  await notifyManager(membership.company_id, membership.building_id, 'issue_reported', 'New resident issue', title);
  await insertAudit(membership.company_id, membership.building_id, user.id, 'CREATE_REPORT_ISSUE', 'report_issues', insertIssue.data.id);
  return { ok: true, message: 'Issue submitted to Supabase.' };
}

export async function assignContractorToFirstJob(account: TestAccount | null): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: true, message: 'Contractor assigned.' };

  const user = await findUserByEmail(account.email);
  if (!user) return { ok: false, message: 'Manager profile not found.' };
  const buildingIds = await getAllowedBuildingIds(user.id, 'manager');
  const contractor = await supabase.from('contractors').select('id, company_id').limit(1).single();
  if (contractor.error) return { ok: false, message: contractor.error.message };

  const job = await supabase.from('maintenance_requests').select('*').in('building_id', buildingIds).limit(1).single();
  if (job.error) return { ok: false, message: job.error.message };

  const workOrder = await supabase.from('work_orders').insert({
    company_id: job.data.company_id,
    building_id: job.data.building_id,
    maintenance_request_id: job.data.id,
    contractor_id: contractor.data.id,
    status: 'Assigned'
  }).select('id').single();

  if (workOrder.error) return { ok: false, message: workOrder.error.message };
  await supabase.from('maintenance_requests').update({ status: 'Assigned' }).eq('id', job.data.id);
  await notifyContractor(job.data.company_id, job.data.building_id, contractor.data.id, 'contractor_assigned', 'New assigned job', job.data.title);
  await insertAudit(job.data.company_id, job.data.building_id, user.id, 'ASSIGN_CONTRACTOR', 'work_orders', workOrder.data.id);
  return { ok: true, message: 'Contractor assigned in Supabase.' };
}

export async function addContractorUpdate(account: TestAccount | null): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: true, message: 'Contractor update saved.' };

  const contractor = await supabase.from('contractors').select('id, company_id').eq('email', account.email).single();
  if (contractor.error) return { ok: false, message: contractor.error.message };

  const workOrder = await supabase
    .from('work_orders')
    .select('*, maintenance_requests(resident_id,title)')
    .eq('contractor_id', contractor.data.id)
    .limit(1)
    .single();
  if (workOrder.error) return { ok: false, message: workOrder.error.message };

  const update = await supabase.from('contractor_job_updates').insert({
    company_id: workOrder.data.company_id,
    building_id: workOrder.data.building_id,
    work_order_id: workOrder.data.id,
    contractor_id: contractor.data.id,
    status: 'In Progress',
    body: 'Contractor has attended site and uploaded a progress update.'
  }).select('id').single();

  if (update.error) return { ok: false, message: update.error.message };
  await supabase.from('work_orders').update({ status: 'In Progress' }).eq('id', workOrder.data.id);
  await supabase.from('maintenance_requests').update({ status: 'In Progress' }).eq('id', workOrder.data.maintenance_request_id);
  await notifyManager(workOrder.data.company_id, workOrder.data.building_id, 'contractor_update', 'Contractor updated job', 'A contractor has added a progress update.');
  const residentId = workOrder.data.maintenance_requests?.resident_id;
  if (residentId) {
    await insertNotification(workOrder.data.company_id, workOrder.data.building_id, residentId, 'contractor_update', 'Maintenance update', 'A contractor has updated your job.');
  }
  await insertAudit(workOrder.data.company_id, workOrder.data.building_id, null, 'CONTRACTOR_UPDATE', 'contractor_job_updates', update.data.id);
  return { ok: true, message: 'Job update saved in Supabase.' };
}

export async function createNotice(account: TestAccount | null): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: true, message: 'Notice published.' };
  const user = await findUserByEmail(account.email);
  const membership = user ? await firstMembership(user.id) : null;
  if (!user || !membership) return { ok: false, message: 'Manager membership not found.' };

  const notice = await supabase.from('notices').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    created_by: user.id,
    title: 'Lift maintenance update',
    body: 'Lift contractor attendance is scheduled. Residents will be updated after completion.',
    category: 'Maintenance update',
    priority: 'Medium',
    target_audience: 'all residents',
    notification_channels: ['in-app', 'email']
  }).select('id').single();
  if (notice.error) return { ok: false, message: notice.error.message };
  await notifyRole(membership.company_id, membership.building_id, 'resident', 'notice_created', 'New building notice', 'A new notice is available.');
  await insertAudit(membership.company_id, membership.building_id, user.id, 'CREATE_NOTICE', 'notices', notice.data.id);
  return { ok: true, message: 'Notice published in Supabase.' };
}

export async function sendResidentMessage(account: TestAccount | null): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: true, message: 'Message sent.' };
  const user = await findUserByEmail(account.email);
  const manager = await findUserByEmail('manager@northshorestrata.com.au');
  const membership = user ? await firstMembership(user.id) : null;
  if (!user || !manager || !membership) return { ok: false, message: 'Resident or manager profile not found.' };
  const message = await supabase.from('messages').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    sender_id: user.id,
    recipient_id: manager.id,
    channel: 'resident-manager',
    subject: 'Question about reported issue',
    body: 'Can you please confirm when the contractor will attend?'
  }).select('id').single();
  if (message.error) return { ok: false, message: message.error.message };
  await supabase.from('notifications').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    user_id: manager.id,
    event_type: 'resident_message',
    title: 'New resident message',
    body: 'A resident sent a message from StrataOS.',
    channels: ['in-app']
  });
  await insertAudit(membership.company_id, membership.building_id, user.id, 'SEND_MESSAGE', 'messages', message.data.id);
  return { ok: true, message: 'Message sent in Supabase.' };
}

export async function uploadDocument(account: TestAccount | null): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: true, message: 'Document uploaded.' };
  const user = await findUserByEmail(account.email);
  const membership = user ? await firstMembership(user.id) : null;
  if (!user || !membership) return { ok: false, message: 'Manager membership not found.' };
  const document = await supabase.from('documents').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    uploaded_by: user.id,
    category: 'Meeting minutes',
    title: 'Committee minutes - June',
    file_url: 'https://example.com/committee-minutes-june.pdf',
    visibility: 'residents',
    version: 1
  }).select('id').single();
  if (document.error) return { ok: false, message: document.error.message };
  await notifyRole(membership.company_id, membership.building_id, 'resident', 'document_uploaded', 'New document available', 'A new building document has been uploaded.');
  await insertAudit(membership.company_id, membership.building_id, user.id, 'UPLOAD_DOCUMENT', 'documents', document.data.id);
  return { ok: true, message: 'Document record saved in Supabase.' };
}

export async function voteOnMotion(account: TestAccount | null): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: true, message: 'Committee vote recorded.' };
  const user = await findUserByEmail(account.email);
  if (!user) return { ok: false, message: 'Committee profile not found.' };
  const buildingIds = await getAllowedBuildingIds(user.id, 'committee');
  if (!buildingIds.length) return { ok: false, message: 'Committee building membership not found.' };
  const motion = await supabase.from('committee_motions').select('*').in('building_id', buildingIds).limit(1).single();
  if (motion.error) return { ok: false, message: motion.error.message };
  const vote = await supabase.from('committee_votes').upsert({
    company_id: motion.data.company_id,
    motion_id: motion.data.id,
    user_id: user.id,
    vote: 'yes',
    signed_at: new Date().toISOString()
  }, { onConflict: 'motion_id,user_id' }).select('id').single();
  if (vote.error) return { ok: false, message: vote.error.message };
  await notifyManager(motion.data.company_id, motion.data.building_id, 'committee_vote', 'Committee vote recorded', 'A committee member voted on a motion.');
  await insertAudit(motion.data.company_id, motion.data.building_id, user.id, 'COMMITTEE_VOTE', 'committee_votes', vote.data.id);
  return { ok: true, message: 'Vote recorded in Supabase.' };
}

async function findUserByEmail(email: string) {
  if (!supabase) return null;
  const result = await supabase.from('users').select('*').eq('email', email).maybeSingle();
  return result.data;
}

async function firstMembership(userId: string) {
  if (!supabase) return null;
  const result = await supabase.from('building_memberships').select('*').eq('user_id', userId).limit(1).maybeSingle();
  return result.data;
}

async function getAllowedBuildingIds(userId: string, role: Role) {
  if (!supabase) return buildings.map((building) => building.id);
  if (role === 'super_admin' || role === 'portfolio_admin') {
    const rows = await supabase.from('buildings').select('id');
    return rows.data?.map((row) => row.id) ?? [];
  }
  const memberships = await supabase.from('building_memberships').select('building_id').eq('user_id', userId);
  return memberships.data?.map((row) => row.building_id) ?? [];
}

async function insertAudit(companyId: string, buildingId: string | null, userId: string | null, action: string, entityType: string, entityId: string) {
  if (!supabase) return;
  await supabase.from('audit_logs').insert({
    company_id: companyId,
    building_id: buildingId,
    user_id: userId,
    action,
    entity_type: entityType,
    entity_id: entityId
  });
}

async function notifyRole(companyId: string, buildingId: string, role: Role, eventType: string, title: string, body: string) {
  if (!supabase) return;
  const recipients = await supabase
    .from('building_memberships')
    .select('user_id')
    .eq('company_id', companyId)
    .eq('building_id', buildingId)
    .eq('role', role);
  const rows = (recipients.data ?? []).map((recipient) => ({
    company_id: companyId,
    building_id: buildingId,
    user_id: recipient.user_id,
    event_type: eventType,
    title,
    body,
    channels: ['in-app', 'email']
  }));
  if (rows.length) await supabase.from('notifications').insert(rows);
}

async function notifyManager(companyId: string, buildingId: string, eventType: string, title: string, body: string) {
  if (!supabase) return;
  const manager = await findUserByEmail('manager@northshorestrata.com.au');
  if (!manager) return;
  await insertNotification(companyId, buildingId, manager.id, eventType, title, body);
}

async function notifyContractor(companyId: string, buildingId: string, contractorId: string, eventType: string, title: string, body: string) {
  if (!supabase) return;
  const contractor = await supabase.from('contractors').select('email').eq('id', contractorId).maybeSingle();
  if (!contractor.data?.email) return;
  const user = await findUserByEmail(contractor.data.email);
  if (!user) return;
  await insertNotification(companyId, buildingId, user.id, eventType, title, body);
}

async function insertNotification(companyId: string, buildingId: string, userId: string, eventType: string, title: string, body: string) {
  if (!supabase) return;
  await supabase.from('notifications').insert({
    company_id: companyId,
    building_id: buildingId,
    user_id: userId,
    event_type: eventType,
    title,
    body,
    channels: ['in-app', 'email']
  });
}

function mapNotice(row: any): Notice {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    buildingId: row.building_id,
    priority: row.priority,
    audience: row.target_audience,
    publishAt: row.scheduled_publish_at ?? row.created_at,
    channels: row.notification_channels ?? ['in-app'],
    reads: Object.keys(row.read_receipts ?? {}).length,
    body: row.body
  };
}

function mapIssue(row: any): ReportIssue {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    severity: row.severity,
    buildingId: row.building_id,
    unit: row.unit_number ?? '1A',
    resident: row.resident_name ?? 'Resident',
    outcome: row.routing_outcome,
    status: row.status,
    submitted: row.created_at
  };
}

function mapMaintenance(row: any): MaintenanceRequest {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    buildingId: row.building_id,
    unit: row.unit_number ?? '1A',
    resident: row.resident_name ?? 'Resident',
    contractorId: row.contractor_id,
    priority: row.priority,
    status: row.status,
    submitted: row.created_at,
    slaHours: 48,
    overdue: row.sla_due_at ? new Date(row.sla_due_at).getTime() < Date.now() : false,
    access: row.preferred_access_times ?? 'Resident appointment required'
  };
}

function mapSimple(row: any, title: string, meta: string): SimpleRecord {
  return {
    id: row.id,
    title,
    buildingId: row.building_id ?? 'b1',
    owner: row.owner_name ?? row.sender_name ?? row.uploaded_by ?? 'System',
    status: row.status ?? 'Open',
    due: row.created_at ?? row.due_date,
    meta
  };
}

function emptyResult() {
  return Promise.resolve({ data: [], error: null });
}
