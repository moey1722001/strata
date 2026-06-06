import { supabase, isSupabaseConfigured, supabaseEnvStatus } from './supabase';
import { auditLogs, buildingConfigurations, company, incidents, packages, testAccounts } from '../data';
import type { BuildingConfiguration, MaintenanceRequest, Notice, Priority, ReportIssue, Role, SimpleRecord, TestAccount } from '../data';

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
  buildingConfigurations: BuildingConfiguration[];
};

export type MvpActionResult =
  | { ok: true; message: string }
  | { ok: false; message: string };

const emptyData: MvpData = {
  notices: [],
  reportIssues: [],
  maintenanceRequests: [],
  messages: [],
  documents: [],
  notifications: [],
  auditLogs: [],
  motions: [],
  facilityBookings: [],
  renovations: [],
  packages,
  incidents,
  buildingConfigurations
};

type Profile = {
  id: string;
  company_id: string;
  email: string;
  full_name?: string;
};

type UserContext = {
  ok: true;
  user: Profile;
  membership: any;
};

const requiredTables = [
  'messages',
  'notices',
  'maintenance_requests',
  'work_orders',
  'documents',
  'facility_bookings',
  'notifications',
  'audit_logs',
  'building_settings'
] as const;

export async function runSupabaseDiagnostic(account: TestAccount | null): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase) {
    return { ok: false, message: `Supabase diagnostic: Missing env vars (${supabaseEnvStatus.missing.join(', ') || 'unknown'}).` };
  }

  const auth = await supabase.auth.getSession();
  if (auth.error) {
    return { ok: false, message: `Supabase diagnostic: Invalid keys or auth session (${auth.error.message}).` };
  }

  if (account) {
    const signIn = await signInTestAccount(account);
    if (!signIn.ok) return { ok: false, message: `Supabase diagnostic: Invalid keys or test login blocked (${signIn.message}).` };
  }

  for (const table of requiredTables) {
    const result = await supabase.from(table).select('*', { count: 'exact', head: true }).limit(1);
    if (result.error) {
      return { ok: false, message: `Supabase diagnostic: ${classifySupabaseError(result.error)} while checking ${table} (${result.error.message}).` };
    }
  }

  return { ok: true, message: 'Supabase diagnostic: Connected. Env vars loaded, required tables reachable, and scoped RLS read checks passed.' };
}

export async function loadMvpData(account: TestAccount | null, role: Role): Promise<MvpData> {
  if (!isSupabaseConfigured || !supabase || !account) return emptyData;

  const user = await findUserByEmail(account.email);
  if (!user) return emptyData;

  if (role === 'contractor') return loadContractorMvpData(account, user.id);

  const allowedBuildingIds = await getAllowedBuildingIds(user.id, role);
  const companyId = user.company_id ?? company.id;
  const hasBuildingScope = allowedBuildingIds.length > 0;
  const buildingFilter = hasBuildingScope ? allowedBuildingIds : ['00000000-0000-0000-0000-000000000000'];

  const [
    noticeRows,
    issueRows,
    maintenanceRows,
    workOrderRows,
    messageRows,
    documentRows,
    notificationRows,
    auditRows,
    motionRows,
    voteRows,
    facilityRows,
    renovationRows,
    buildingSettingsRows
  ] = await Promise.all([
    supabase.from('notices').select('*').in('building_id', buildingFilter).order('created_at', { ascending: false }),
    supabase.from('report_issues').select('*, lots(unit_number), users(full_name)').in('building_id', buildingFilter).order('created_at', { ascending: false }),
    supabase.from('maintenance_requests').select('*, lots(unit_number), users(full_name)').in('building_id', buildingFilter).order('created_at', { ascending: false }),
    supabase.from('work_orders').select('*').in('building_id', buildingFilter).order('created_at', { ascending: false }),
    hasBuildingScope
      ? supabase.from('messages').select('*, sender:users!messages_sender_id_fkey(full_name), recipient:users!messages_recipient_id_fkey(full_name)').or(`building_id.in.(${allowedBuildingIds.join(',')}),recipient_id.eq.${user.id},sender_id.eq.${user.id}`).order('created_at', { ascending: false })
      : supabase.from('messages').select('*, sender:users!messages_sender_id_fkey(full_name), recipient:users!messages_recipient_id_fkey(full_name)').or(`recipient_id.eq.${user.id},sender_id.eq.${user.id}`).order('created_at', { ascending: false }),
    supabase.from('documents').select('*, uploaded_by_user:users!documents_uploaded_by_fkey(full_name)').in('building_id', buildingFilter).order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    supabase.from('audit_logs').select('*').eq('company_id', companyId).order('created_at', { ascending: false }).limit(30),
    supabase.from('committee_motions').select('*').in('building_id', buildingFilter).order('closes_at', { ascending: true }),
    supabase.from('committee_votes').select('motion_id, vote'),
    supabase.from('facility_bookings').select('*, resident:users!facility_bookings_resident_id_fkey(full_name)').in('building_id', buildingFilter).order('starts_at', { ascending: false }),
    supabase.from('renovation_requests').select('*, resident:users!renovation_requests_resident_id_fkey(full_name)').in('building_id', buildingFilter),
    supabase.from('building_settings').select('*').in('building_id', buildingFilter)
  ]);

  const workOrders = workOrderRows.data ?? [];
  const votes = voteRows.data ?? [];

  return {
    notices: (noticeRows.data ?? []).map(mapNotice),
    reportIssues: (issueRows.data ?? []).map(mapIssue),
    maintenanceRequests: (maintenanceRows.data ?? []).map((row) => mapMaintenance(row, workOrders.find((workOrder) => workOrder.maintenance_request_id === row.id))),
    messages: (messageRows.data ?? []).map(mapMessage),
    documents: (documentRows.data ?? []).map(mapDocument),
    notifications: (notificationRows.data ?? []).map((row) => mapSimple(row, row.title, row.event_type)),
    auditLogs: (auditRows.data ?? []).map((row) => mapSimple(row, row.action, row.entity_type)),
    motions: (motionRows.data ?? []).map((row) => mapMotion(row, votes.filter((vote) => vote.motion_id === row.id))),
    facilityBookings: (facilityRows.data ?? []).map(mapFacilityBooking),
    renovations: (renovationRows.data ?? []).map(mapRenovation),
    packages,
    incidents,
    buildingConfigurations: (buildingSettingsRows.data ?? []).length ? (buildingSettingsRows.data ?? []).map(mapBuildingSettings) : buildingConfigurations.filter((config) => buildingFilter.includes(config.buildingId))
  };
}

async function loadContractorMvpData(account: TestAccount, userId: string): Promise<MvpData> {
  if (!supabase) return emptyData;
  const contractor = await supabase.from('contractors').select('id').eq('email', account.email).maybeSingle();
  if (!contractor.data) return emptyData;

  const [workOrders, messagesForContractor, notificationsForContractor, documentsForContractor] = await Promise.all([
    supabase.from('work_orders').select('*, maintenance_requests(*, lots(unit_number), users(full_name))').eq('contractor_id', contractor.data.id).order('created_at', { ascending: false }),
    supabase.from('messages').select('*, sender:users!messages_sender_id_fkey(full_name), recipient:users!messages_recipient_id_fkey(full_name)').or(`recipient_id.eq.${userId},sender_id.eq.${userId}`).order('created_at', { ascending: false }),
    supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
    supabase.from('contractor_documents').select('*').eq('contractor_id', contractor.data.id)
  ]);

  return {
    ...emptyData,
    maintenanceRequests: (workOrders.data ?? []).map((row) => mapMaintenance({
      ...(row.maintenance_requests ?? {}),
      contractor_id: row.contractor_id,
      status: row.status
    }, row)),
    messages: (messagesForContractor.data ?? []).map(mapMessage),
    documents: (documentsForContractor.data ?? []).map((row) => ({
      id: row.id,
      title: row.document_type,
      buildingId: localBuildingId(row.building_id),
      owner: account.name,
      status: row.expiry_date ? 'Visible' : 'Open',
      due: row.expiry_date,
      meta: row.file_url
    })),
    notifications: (notificationsForContractor.data ?? []).map((row) => mapSimple(row, row.title, row.event_type)),
    buildingConfigurations
  };
}

export async function signInTestAccount(account: TestAccount): Promise<MvpActionResult> {
  if (!isSupabaseConfigured || !supabase) return { ok: false, message: 'Supabase environment variables are required for persistent testing.' };

  const password = import.meta.env.VITE_SUPABASE_TEST_PASSWORD as string | undefined;
  if (!password) return { ok: false, message: 'VITE_SUPABASE_TEST_PASSWORD is required for seeded role switching.' };

  const result = await supabase.auth.signInWithPassword({ email: account.email, password });
  if (result.error) return { ok: false, message: result.error.message };
  return { ok: true, message: 'Signed in with Supabase Auth.' };
}

export async function updateBuildingConfiguration(account: TestAccount | null, config: BuildingConfiguration, action = 'UPDATE_BUILDING_SETTINGS'): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user, membership } = context;

  const update = await supabase!.from('building_settings').update({
    profile: config.profile,
    facilities: config.facilities,
    contacts: config.contacts,
    issue_categories: config.issueCategories,
    renovation_rules: config.renovationRules,
    package_management: config.packageManagement,
    compliance_items: config.compliance,
    assets: config.assets,
    resident_permissions: config.residentPermissions,
    notification_rules: config.notificationRules,
    updated_at: new Date().toISOString()
  }).eq('local_key', config.buildingId).select('id, building_id').maybeSingle();

  if (update.error) return { ok: false, message: update.error.message };
  if (!update.data) return { ok: false, message: 'Building settings row not found. Apply the building_settings Supabase migration first.' };

  await insertAudit(membership.company_id, update.data.building_id, user.id, action, 'building_settings', update.data.id);
  return { ok: true, message: 'Building settings saved in Supabase.' };
}

export async function createResidentIssue(account: TestAccount | null, payload?: Partial<ReportIssue> & { description?: string }): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user, membership } = context;

  const category = payload?.category ?? 'Maintenance';
  const severity = payload?.severity ?? 'Medium';
  const title = payload?.title ?? `${category} issue reported`;
  const description = payload?.description ?? 'Resident submitted issue from Atlas.';

  const maintenance = await supabase!.from('maintenance_requests').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    lot_id: membership.lot_id,
    resident_id: user.id,
    category,
    priority: severity,
    title,
    description,
    permission_to_access: true,
    preferred_access_times: 'Resident appointment required',
    status: 'Submitted',
    sla_due_at: new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString()
  }).select('id').single();
  if (maintenance.error) return { ok: false, message: maintenance.error.message };

  const issue = await supabase!.from('report_issues').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    lot_id: membership.lot_id,
    resident_id: user.id,
    category,
    severity,
    title,
    description,
    routing_outcome: severity === 'Emergency' || category === 'Safety' ? 'Maintenance request + incident' : 'Maintenance request',
    maintenance_request_id: maintenance.data.id,
    status: 'Triage'
  }).select('id').single();
  if (issue.error) return { ok: false, message: issue.error.message };

  await notifyManager(membership.company_id, membership.building_id, 'issue_reported', 'New resident issue', title);
  await insertAudit(membership.company_id, membership.building_id, user.id, 'CREATE_REPORT_ISSUE', 'report_issues', issue.data.id);
  return { ok: true, message: 'Issue saved in Supabase.' };
}

export async function assignContractorToFirstJob(account: TestAccount | null, maintenanceRequestId?: string): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user } = context;
  const buildingIds = await getAllowedBuildingIds(user.id, 'manager');
  const contractor = await supabase!.from('contractors').select('id, company_id').eq('email', 'contractor@liftcare.com.au').maybeSingle();
  if (!contractor.data) return { ok: false, message: 'LiftCare NSW contractor not found.' };

  const resolvedMaintenanceId = maintenanceRequestId ? await resolveMaintenanceRequestId(maintenanceRequestId) : null;
  const jobQuery = supabase!.from('maintenance_requests').select('*').in('building_id', buildingIds);
  const job = resolvedMaintenanceId
    ? await jobQuery.eq('id', resolvedMaintenanceId).maybeSingle()
    : await jobQuery.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!job.data) return { ok: false, message: 'Maintenance request not found.' };

  const workOrder = await supabase!.from('work_orders').upsert({
    company_id: job.data.company_id,
    building_id: job.data.building_id,
    maintenance_request_id: job.data.id,
    contractor_id: contractor.data.id,
    status: 'Assigned'
  }, { onConflict: 'maintenance_request_id,contractor_id' }).select('id').single();
  if (workOrder.error) return { ok: false, message: workOrder.error.message };

  await supabase!.from('maintenance_requests').update({ status: 'Assigned' }).eq('id', job.data.id);
  await notifyContractor(job.data.company_id, job.data.building_id, contractor.data.id, 'contractor_assigned', 'New assigned job', job.data.title);
  await insertAudit(job.data.company_id, job.data.building_id, user.id, 'ASSIGN_CONTRACTOR', 'work_orders', workOrder.data.id);
  return { ok: true, message: 'Contractor assignment saved in Supabase.' };
}

export async function updateReportIssueStatus(account: TestAccount | null, id: string, status: string): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user } = context;
  const issue = await supabase!.from('report_issues').select('*').eq('id', id).maybeSingle();
  if (!issue.data) return { ok: false, message: 'Issue not found.' };
  const update = await supabase!.from('report_issues').update({ status }).eq('id', id);
  if (update.error) return { ok: false, message: update.error.message };
  if (issue.data.maintenance_request_id) await supabase!.from('maintenance_requests').update({ status }).eq('id', issue.data.maintenance_request_id);
  if (issue.data.resident_id) await insertNotification(issue.data.company_id, issue.data.building_id, issue.data.resident_id, 'issue_status_update', 'Issue status updated', status);
  await insertAudit(issue.data.company_id, issue.data.building_id, user.id, 'UPDATE_REPORT_ISSUE', 'report_issues', id);
  return { ok: true, message: 'Issue status saved in Supabase.' };
}

export async function updateMaintenanceRequestStatus(account: TestAccount | null, id: string, status: string, note?: string): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user } = context;

  const resolvedId = await resolveMaintenanceRequestId(id);
  const maintenance = resolvedId ? await supabase!.from('maintenance_requests').select('*').eq('id', resolvedId).maybeSingle() : { data: null };
  if (!maintenance.data) return { ok: false, message: 'Maintenance request not found.' };
  const update = await supabase!.from('maintenance_requests').update({ status }).eq('id', resolvedId);
  if (update.error) return { ok: false, message: update.error.message };
  await supabase!.from('work_orders').update({ status }).eq('maintenance_request_id', resolvedId);

  if (maintenance.data.resident_id) {
    await supabase!.from('messages').insert({
      company_id: maintenance.data.company_id,
      building_id: maintenance.data.building_id,
      sender_id: user.id,
      recipient_id: maintenance.data.resident_id,
      channel: 'maintenance-update',
      subject: `Manager update: ${status}`,
      body: note ?? `Status changed to ${status}.`,
      linked_entity_type: 'maintenance_requests',
      linked_entity_id: resolvedId
    });
    await insertNotification(maintenance.data.company_id, maintenance.data.building_id, maintenance.data.resident_id, 'maintenance_update', 'Maintenance update', note ?? `Status changed to ${status}.`);
  }
  await insertAudit(maintenance.data.company_id, maintenance.data.building_id, user.id, 'UPDATE_MAINTENANCE_STATUS', 'maintenance_requests', resolvedId);
  return { ok: true, message: 'Maintenance status saved in Supabase.' };
}

export async function addContractorUpdate(account: TestAccount | null, maintenanceRequestId?: string, status = 'In Progress', note?: string): Promise<MvpActionResult> {
  if (!supabase || !account) return { ok: false, message: 'Supabase account is required.' };
  const contractor = await supabase.from('contractors').select('id, company_id').eq('email', account.email).maybeSingle();
  if (!contractor.data) return { ok: false, message: 'Contractor profile not found.' };

  const resolvedMaintenanceId = maintenanceRequestId ? await resolveMaintenanceRequestId(maintenanceRequestId) : null;
  const query = supabase.from('work_orders').select('*, maintenance_requests(resident_id,title)').eq('contractor_id', contractor.data.id);
  const workOrder = resolvedMaintenanceId
    ? await query.eq('maintenance_request_id', resolvedMaintenanceId).maybeSingle()
    : await query.order('created_at', { ascending: false }).limit(1).maybeSingle();
  if (!workOrder.data) return { ok: false, message: 'Assigned work order not found.' };

  const update = await supabase.from('contractor_job_updates').insert({
    company_id: workOrder.data.company_id,
    building_id: workOrder.data.building_id,
    work_order_id: workOrder.data.id,
    contractor_id: contractor.data.id,
    status,
    body: note ?? `Contractor updated job to ${status}.`
  }).select('id').single();
  if (update.error) return { ok: false, message: update.error.message };

  await supabase.from('work_orders').update({ status }).eq('id', workOrder.data.id);
  await supabase.from('maintenance_requests').update({ status }).eq('id', workOrder.data.maintenance_request_id);
  await notifyManager(workOrder.data.company_id, workOrder.data.building_id, 'contractor_update', 'Contractor updated job', note ?? status);
  const residentId = workOrder.data.maintenance_requests?.resident_id;
  if (residentId) await insertNotification(workOrder.data.company_id, workOrder.data.building_id, residentId, 'contractor_update', 'Maintenance update', note ?? status);
  await insertAudit(workOrder.data.company_id, workOrder.data.building_id, null, 'CONTRACTOR_UPDATE', 'contractor_job_updates', update.data.id);
  return { ok: true, message: 'Contractor update saved in Supabase.' };
}

export async function createNotice(account: TestAccount | null, payload?: Partial<Notice>): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user, membership } = context;
  const notice = await supabase!.from('notices').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    created_by: user.id,
    title: payload?.title ?? 'Building notice',
    body: payload?.body ?? 'Building notice created in Atlas.',
    category: payload?.category ?? 'Announcement',
    priority: payload?.priority ?? 'Medium',
    target_audience: payload?.audience ?? 'all residents',
    notification_channels: ['in-app', 'email']
  }).select('id').single();
  if (notice.error) return { ok: false, message: notice.error.message };
  await notifyRole(membership.company_id, membership.building_id, 'resident', 'notice_created', 'New building notice', payload?.title ?? 'A new notice is available.');
  await insertAudit(membership.company_id, membership.building_id, user.id, 'CREATE_NOTICE', 'notices', notice.data.id);
  return { ok: true, message: 'Notice saved in Supabase.' };
}

export async function sendResidentMessage(account: TestAccount | null, payload?: Partial<SimpleRecord>): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user, membership } = context;
  const recipientEmail = account?.role === 'manager' ? 'resident@example.com' : 'manager@northshorestrata.com.au';
  const recipient = await findUserByEmail(recipientEmail);
  if (!recipient) return { ok: false, message: 'Message recipient profile not found.' };
  const recipientMembership = account?.role === 'manager' ? await firstMembership(recipient.id) : null;
  const messageCompanyId = recipientMembership?.company_id ?? membership.company_id;
  const messageBuildingId = recipientMembership?.building_id ?? membership.building_id;
  const message = await supabase!.from('messages').insert({
    company_id: messageCompanyId,
    building_id: messageBuildingId,
    sender_id: user.id,
    recipient_id: recipient.id,
    channel: 'resident-manager',
    subject: payload?.title ?? 'Message',
    body: payload?.meta ?? 'Message created in Atlas.'
  }).select('id').single();
  if (message.error) return { ok: false, message: message.error.message };
  await insertNotification(messageCompanyId, messageBuildingId, recipient.id, 'message_created', 'New message', payload?.title ?? 'A new message is available.');
  await insertAudit(messageCompanyId, messageBuildingId, user.id, 'SEND_MESSAGE', 'messages', message.data.id);
  return { ok: true, message: 'Message saved in Supabase.' };
}

export async function uploadDocument(account: TestAccount | null, payload?: Partial<SimpleRecord>): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user, membership } = context;
  const visibility = payload?.status === 'Committee only' ? 'committee' : 'residents';
  const document = await supabase!.from('documents').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    uploaded_by: user.id,
    category: payload?.meta ?? 'Building documents',
    title: payload?.title ?? 'Building document',
    file_url: 'https://example.com/atlas-mvp-document.pdf',
    visibility,
    version: 1
  }).select('id').single();
  if (document.error) return { ok: false, message: document.error.message };
  if (visibility === 'residents') await notifyRole(membership.company_id, membership.building_id, 'resident', 'document_uploaded', 'New document available', payload?.title ?? 'A new document is available.');
  await insertAudit(membership.company_id, membership.building_id, user.id, 'UPLOAD_DOCUMENT', 'documents', document.data.id);
  return { ok: true, message: 'Document saved in Supabase.' };
}

export async function bookFacility(account: TestAccount | null, payload?: Partial<SimpleRecord>): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user, membership } = context;
  const startsAt = payload?.due ? new Date(`${payload.due}T09:00:00`).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
  const endsAt = payload?.due ? new Date(`${payload.due}T11:00:00`).toISOString() : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 2 * 60 * 60 * 1000).toISOString();
  const booking = await supabase!.from('facility_bookings').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    resident_id: user.id,
    facility: payload?.title ?? 'Rooftop BBQ booking',
    starts_at: startsAt,
    ends_at: endsAt,
    status: 'Submitted',
    deposit_placeholder: 150
  }).select('id').single();
  if (booking.error) return { ok: false, message: booking.error.message };
  await notifyManager(membership.company_id, membership.building_id, 'facility_booking', 'Facility booking requested', payload?.title ?? 'Facility booking');
  await insertAudit(membership.company_id, membership.building_id, user.id, 'CREATE_FACILITY_BOOKING', 'facility_bookings', booking.data.id);
  return { ok: true, message: 'Facility booking saved in Supabase.' };
}

export async function updateFacilityBooking(account: TestAccount | null, id: string, status: string): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user } = context;
  const existing = await supabase!.from('facility_bookings').select('*').eq('id', id).maybeSingle();
  if (!existing.data) return { ok: false, message: 'Facility booking not found.' };
  const update = await supabase!.from('facility_bookings').update({ status }).eq('id', id);
  if (update.error) return { ok: false, message: update.error.message };
  if (existing.data.resident_id) await insertNotification(existing.data.company_id, existing.data.building_id, existing.data.resident_id, 'facility_booking_update', 'Facility booking updated', `Booking ${status.toLowerCase()}.`);
  await insertAudit(existing.data.company_id, existing.data.building_id, user.id, 'UPDATE_FACILITY_BOOKING', 'facility_bookings', id);
  return { ok: true, message: 'Facility booking status saved in Supabase.' };
}

export async function submitRenovation(account: TestAccount | null, payload?: Partial<SimpleRecord>): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user, membership } = context;
  const renovation = await supabase!.from('renovation_requests').insert({
    company_id: membership.company_id,
    building_id: membership.building_id,
    lot_id: membership.lot_id,
    resident_id: user.id,
    scope_of_works: payload?.meta ?? payload?.title ?? 'Apartment renovation request',
    contractor_details: { title: payload?.title ?? 'Apartment renovation request' },
    noise_impact: 'Submitted from Atlas MVP',
    bylaw_acknowledged: true,
    status: 'Manager Review'
  }).select('id').single();
  if (renovation.error) return { ok: false, message: renovation.error.message };
  await notifyManager(membership.company_id, membership.building_id, 'renovation_request', 'Renovation request submitted', payload?.title ?? 'Renovation request');
  await insertAudit(membership.company_id, membership.building_id, user.id, 'CREATE_RENOVATION_REQUEST', 'renovation_requests', renovation.data.id);
  return { ok: true, message: 'Renovation request saved in Supabase.' };
}

export async function updateRenovationStatus(account: TestAccount | null, id: string, status: string, note?: string): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user } = context;
  const existing = await supabase!.from('renovation_requests').select('*').eq('id', id).maybeSingle();
  if (!existing.data) return { ok: false, message: 'Renovation request not found.' };
  const update = await supabase!.from('renovation_requests').update({ status, committee_comments: [{ at: new Date().toISOString(), body: note ?? status }] }).eq('id', id);
  if (update.error) return { ok: false, message: update.error.message };
  if (existing.data.resident_id) await insertNotification(existing.data.company_id, existing.data.building_id, existing.data.resident_id, 'renovation_update', 'Renovation request updated', status);
  await insertAudit(existing.data.company_id, existing.data.building_id, user.id, 'UPDATE_RENOVATION_REQUEST', 'renovation_requests', id);
  return { ok: true, message: 'Renovation status saved in Supabase.' };
}

export async function voteOnMotion(account: TestAccount | null, payload?: Partial<SimpleRecord>): Promise<MvpActionResult> {
  const context = await requireUserContext(account);
  if (!context.ok) return context;
  const { user } = context;
  const buildingIds = await getAllowedBuildingIds(user.id, 'committee');
  const motion = payload?.id
    ? await supabase!.from('committee_motions').select('*').eq('id', payload.id).maybeSingle()
    : await supabase!.from('committee_motions').select('*').in('building_id', buildingIds).limit(1).maybeSingle();
  if (!motion.data) return { ok: false, message: 'Committee motion not found.' };
  const voteValue = (payload?.meta ?? 'Yes').toLowerCase() === 'no' ? 'no' : (payload?.meta ?? 'Yes').toLowerCase() === 'abstain' ? 'abstain' : 'yes';
  const vote = await supabase!.from('committee_votes').upsert({
    company_id: motion.data.company_id,
    motion_id: motion.data.id,
    user_id: user.id,
    vote: voteValue,
    signed_at: new Date().toISOString()
  }, { onConflict: 'motion_id,user_id' }).select('id').single();
  if (vote.error) return { ok: false, message: vote.error.message };
  await notifyManager(motion.data.company_id, motion.data.building_id, 'committee_vote', 'Committee vote recorded', 'A committee member voted on a motion.');
  await insertAudit(motion.data.company_id, motion.data.building_id, user.id, 'COMMITTEE_VOTE', 'committee_votes', vote.data.id);
  return { ok: true, message: 'Vote saved in Supabase.' };
}

async function requireUserContext(account: TestAccount | null): Promise<UserContext | { ok: false; message: string }> {
  if (!isSupabaseConfigured || !supabase || !account) return { ok: false, message: 'Supabase is required for persistent workflow testing.' };
  const user = await findUserByEmail(account.email);
  const membership = user ? await firstMembership(user.id) : null;
  if (!user || !membership) return { ok: false, message: 'Supabase user/building membership not found.' };
  return { ok: true, user, membership };
}

async function findUserByEmail(email: string): Promise<Profile | null> {
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
  if (!supabase) return [];
  if (role === 'super_admin' || role === 'portfolio_admin') {
    const rows = await supabase.from('buildings').select('id');
    return rows.data?.map((row) => row.id) ?? [];
  }
  const memberships = await supabase.from('building_memberships').select('building_id').eq('user_id', userId);
  return memberships.data?.map((row) => row.building_id) ?? [];
}

async function resolveMaintenanceRequestId(id: string) {
  if (!supabase) return id;
  const maintenance = await supabase.from('maintenance_requests').select('id').eq('id', id).maybeSingle();
  if (maintenance.data?.id) return maintenance.data.id;
  const issue = await supabase.from('report_issues').select('maintenance_request_id').eq('id', id).maybeSingle();
  return issue.data?.maintenance_request_id ?? null;
}

async function insertAudit(companyId: string, buildingId: string | null, userId: string | null, action: string, entityType: string, entityId: string) {
  if (!supabase) return;
  await supabase.from('audit_logs').insert({ company_id: companyId, building_id: buildingId, user_id: userId, action, entity_type: entityType, entity_id: entityId });
}

async function notifyRole(companyId: string, buildingId: string, role: Role, eventType: string, title: string, body: string) {
  if (!supabase) return;
  const recipients = await supabase.from('building_memberships').select('user_id').eq('company_id', companyId).eq('building_id', buildingId).eq('role', role);
  const rows = (recipients.data ?? []).map((recipient) => ({ company_id: companyId, building_id: buildingId, user_id: recipient.user_id, event_type: eventType, title, body, channels: ['in-app', 'email'] }));
  if (rows.length) await supabase.from('notifications').insert(rows);
}

async function notifyManager(companyId: string, buildingId: string, eventType: string, title: string, body: string) {
  const manager = await findUserByEmail('manager@northshorestrata.com.au');
  if (manager) await insertNotification(companyId, buildingId, manager.id, eventType, title, body);
}

async function notifyContractor(companyId: string, buildingId: string, contractorId: string, eventType: string, title: string, body: string) {
  if (!supabase) return;
  const contractor = await supabase.from('contractors').select('email').eq('id', contractorId).maybeSingle();
  if (!contractor.data?.email) return;
  const user = await findUserByEmail(contractor.data.email);
  if (user) await insertNotification(companyId, buildingId, user.id, eventType, title, body);
}

async function insertNotification(companyId: string, buildingId: string, userId: string, eventType: string, title: string, body: string) {
  if (!supabase) return;
  await supabase.from('notifications').insert({ company_id: companyId, building_id: buildingId, user_id: userId, event_type: eventType, title, body, channels: ['in-app', 'email'] });
}

function classifySupabaseError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? '';
  if (error.code === '42P01' || message.includes('does not exist')) return 'Table missing';
  if (error.code === '42501' || message.includes('row-level security') || message.includes('permission denied')) return 'RLS blocked';
  if (message.includes('invalid jwt') || message.includes('jwt') || message.includes('api key')) return 'Invalid keys';
  return 'Connection error';
}

function localBuildingId(id?: string | null) {
  const ids: Record<string, string> = {
    '00000000-0000-4000-8000-000000000101': 'b1',
    '00000000-0000-4000-8000-000000000102': 'b2',
    '00000000-0000-4000-8000-000000000103': 'b3',
    '00000000-0000-4000-8000-000000000104': 'b4'
  };
  return id ? ids[id] ?? id : 'b1';
}

function localContractorId(id?: string | null) {
  const ids: Record<string, string> = {
    '00000000-0000-4000-8000-000000000701': 'c3',
    '00000000-0000-4000-8000-000000000703': 'c3'
  };
  return id ? ids[id] ?? id : undefined;
}

function mapNotice(row: any): Notice {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    buildingId: localBuildingId(row.building_id),
    priority: row.priority,
    audience: row.target_audience,
    publishAt: row.scheduled_publish_at ?? row.created_at,
    channels: row.notification_channels ?? ['in-app'],
    reads: Object.keys(row.read_receipts ?? {}).length,
    body: row.body
  };
}

function mapBuildingSettings(row: any): BuildingConfiguration {
  return {
    buildingId: row.local_key ?? row.building_id,
    profile: row.profile ?? { name: 'Building', buildingType: 'Strata building', notes: '' },
    facilities: row.facilities ?? [],
    contacts: row.contacts ?? [],
    issueCategories: row.issue_categories ?? [],
    renovationRules: row.renovation_rules ?? [],
    packageManagement: row.package_management ?? { enabled: false },
    compliance: row.compliance_items ?? [],
    assets: row.assets ?? [],
    residentPermissions: row.resident_permissions ?? {
      leviesVisibleTo: 'owners only',
      residentsCanPostFeed: false,
      tenantsCanBookFacilities: false,
      committeeDocumentsVisible: true
    },
    notificationRules: row.notification_rules ?? ['Low: in-app only', 'Medium: in-app + email']
  };
}

function mapIssue(row: any): ReportIssue {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    severity: row.severity,
    buildingId: localBuildingId(row.building_id),
    unit: row.lots?.unit_number ?? '1A',
    resident: row.users?.full_name ?? 'Resident',
    outcome: row.routing_outcome,
    status: row.status,
    submitted: row.created_at
  };
}

function mapMaintenance(row: any, workOrder?: any): MaintenanceRequest {
  return {
    id: row.id,
    title: row.title,
    category: row.category,
    buildingId: localBuildingId(row.building_id),
    unit: row.lots?.unit_number ?? '1A',
    resident: row.users?.full_name ?? 'Resident',
    contractorId: localContractorId(row.contractor_id ?? workOrder?.contractor_id),
    priority: row.priority,
    status: workOrder?.status ?? row.status,
    submitted: row.created_at,
    slaHours: 48,
    overdue: row.sla_due_at ? new Date(row.sla_due_at).getTime() < Date.now() : false,
    access: row.preferred_access_times ?? 'Resident appointment required'
  };
}

function mapMessage(row: any): SimpleRecord {
  return {
    id: row.id,
    title: row.subject ?? row.body?.slice(0, 48) ?? 'Message',
    buildingId: localBuildingId(row.building_id),
    owner: row.sender?.full_name ?? 'System',
    status: row.read_at ? 'Open' : 'Unread',
    due: row.created_at,
    meta: row.body
  };
}

function mapDocument(row: any): SimpleRecord {
  return {
    id: row.id,
    title: row.title,
    buildingId: localBuildingId(row.building_id),
    owner: row.uploaded_by_user?.full_name ?? 'Manager',
    status: row.visibility === 'committee' ? 'Committee only' : 'Visible',
    due: row.created_at,
    meta: row.category
  };
}

function mapFacilityBooking(row: any): SimpleRecord {
  return {
    id: row.id,
    title: row.facility,
    buildingId: localBuildingId(row.building_id),
    owner: row.resident?.full_name ?? 'Resident',
    status: row.status,
    due: row.starts_at,
    meta: row.deposit_placeholder ? `Deposit placeholder ${row.deposit_placeholder}` : 'No fee'
  };
}

function mapRenovation(row: any): SimpleRecord {
  return {
    id: row.id,
    title: row.contractor_details?.title ?? row.scope_of_works?.slice(0, 48) ?? 'Renovation request',
    buildingId: localBuildingId(row.building_id),
    owner: row.resident?.full_name ?? 'Resident',
    status: row.status,
    due: row.proposed_dates ?? 'Not set',
    meta: row.scope_of_works
  };
}

function mapMotion(row: any, votes: any[]): SimpleRecord {
  return {
    id: row.id,
    title: row.title,
    buildingId: localBuildingId(row.building_id),
    owner: 'Committee',
    status: row.status,
    due: row.closes_at,
    amount: row.amount,
    meta: votes.length ? `${votes.length} vote recorded` : row.description
  };
}

function mapSimple(row: any, title: string, meta: string): SimpleRecord {
  return {
    id: row.id,
    title,
    buildingId: localBuildingId(row.building_id),
    owner: row.owner_name ?? row.sender_name ?? row.uploaded_by ?? 'System',
    status: row.status ?? (row.read_at ? 'Open' : 'Unread'),
    due: row.created_at ?? row.due_date,
    meta
  };
}
