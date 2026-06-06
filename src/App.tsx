import { useEffect, useMemo, useState } from 'react';
import type { FormEvent, ReactNode } from 'react';
import type { ComponentProps, ElementType } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Building2,
  CalendarDays,
  CheckCircle2,
  Clock3,
  DollarSign,
  Download,
  Eye,
  FileText,
  Home,
  Menu,
  MessageSquare,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Vote,
  X
} from 'lucide-react';
import {
  auditLogs,
  buildingName,
  buildings,
  getBuildingConfig,
  committeeMembers,
  company,
  complianceItems,
  contractors,
  currency,
  documents,
  facilityBookings,
  filterPrivateForRole,
  filterForRole,
  incidents,
  levies,
  maintenanceRequests,
  meetings,
  messages,
  motions,
  navItems,
  notices,
  notifications,
  packages,
  people,
  projects,
  roleBuildingScope,
  renovations,
  reportIssues,
  rolePermissions,
  roleLabels,
  staff,
  testAccounts
} from './data';
import type { BuildingConfiguration, BuildingContact, LevyRecord, MaintenanceRequest, Notice, PageId, Priority, Project, ReportIssue, Role, SimpleRecord, TestAccount } from './data';
import { AtlasLogo, AtlasMark } from './brand';
import {
  addContractorUpdate,
  assignContractorToFirstJob,
  bookFacility,
  createBuilding,
  createNotice,
  createResidentIssue,
  loadMvpData,
  markMessagesRead,
  runSupabaseDiagnostic,
  sendResidentMessage,
  signInTestAccount,
  submitRenovation,
  updateFacilityBooking,
  updateBuildingConfiguration,
  updateMaintenanceRequestStatus,
  updateReportIssueStatus,
  updateRenovationStatus,
  uploadDocument,
  voteOnMotion
} from './lib/mvpRepository';
import type { MvpActionResult, MvpData } from './lib/mvpRepository';

const priorityClasses: Record<Priority, string> = {
  Emergency: 'bg-red-50 text-red-700 ring-red-200',
  High: 'bg-amber-50 text-amber-800 ring-amber-200',
  Medium: 'bg-blue-50 text-blue-700 ring-blue-200',
  Low: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

const statusClasses: Record<string, string> = {
  Open: 'bg-slate-100 text-slate-700 ring-slate-200',
  Submitted: 'bg-blue-50 text-blue-700 ring-blue-200',
  Scheduled: 'bg-indigo-50 text-indigo-700 ring-indigo-200',
  Approved: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Rejected: 'bg-red-50 text-red-700 ring-red-200',
  Closed: 'bg-slate-900 text-white ring-slate-900',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Overdue: 'bg-red-50 text-red-700 ring-red-200',
  'Due soon': 'bg-amber-50 text-amber-800 ring-amber-200',
  'In progress': 'bg-blue-50 text-blue-700 ring-blue-200',
  'In Progress': 'bg-blue-50 text-blue-700 ring-blue-200',
  'Committee Review': 'bg-purple-50 text-purple-700 ring-purple-200',
  'Manager Review': 'bg-blue-50 text-blue-700 ring-blue-200',
  'More Info Required': 'bg-amber-50 text-amber-800 ring-amber-200',
  Sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Unread: 'bg-red-50 text-red-700 ring-red-200',
  Visible: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

type FlowActions = {
  openForm: (kind: FormKind, context?: FormContext) => void;
  createBuilding: (payload: Record<string, string>) => Promise<void>;
  reportIssue: (payload?: Partial<ReportIssue> & { description?: string }) => Promise<void>;
  assignContractor: (id?: string, payload?: Partial<MaintenanceRequest>) => Promise<void>;
  updateMaintenanceStatus: (id: string, status: string, note?: string) => Promise<void>;
  updateIssueStatus: (id: string, status: string) => Promise<void>;
  notifyResident: (id: string) => Promise<void>;
  contractorUpdate: (id?: string, status?: string, note?: string) => Promise<void>;
  createNotice: (payload?: Partial<Notice>) => Promise<void>;
  sendMessage: (payload?: Partial<SimpleRecord>) => Promise<void>;
  uploadDocument: (payload?: Partial<SimpleRecord> & { file?: File }) => Promise<void>;
  vote: (payload?: Partial<SimpleRecord>) => Promise<void>;
  bookFacility: (payload?: Partial<SimpleRecord>) => Promise<void>;
  submitRenovation: (payload?: Partial<SimpleRecord>) => Promise<void>;
  approveRenovation: (id: string) => Promise<void>;
  requestRenovationInfo: (id: string) => Promise<void>;
  updateFacilityBooking: (id: string, status: string) => Promise<void>;
  recordIncidentUpdate: (id: string) => Promise<void>;
  saveBuildingConfig: (config: BuildingConfiguration, action: string) => Promise<void>;
};

type FormKind =
  | 'addBuilding'
  | 'sendMessage'
  | 'createNotice'
  | 'uploadDocument'
  | 'reportIssue'
  | 'bookFacility'
  | 'submitRenovation'
  | 'assignContractor'
  | 'updateJobStatus'
  | 'voteMotion';

type FormContext = {
  id?: string;
  title?: string;
  status?: string;
};

type ActiveForm = {
  kind: FormKind;
  context?: FormContext;
};

function App() {
  const [role, setRole] = useState<Role>('portfolio_admin');
  const [page, setPage] = useState<PageId>('portfolio');
  const [publicView, setPublicView] = useState<'landing' | 'pricing' | 'login' | 'walkthrough' | 'app'>('app');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<TestAccount | null>(testAccounts.find((account) => account.role === 'portfolio_admin') ?? null);
  const [mvpData, setMvpData] = useState<MvpData>({
    buildings: [],
    notices: [],
    reportIssues: [],
    maintenanceRequests: [],
    contractorUpdates: [],
    messages: [],
    documents: [],
    notifications: [],
    auditLogs: [],
    motions: [],
    facilityBookings: [],
    renovations: [],
    packages: [],
    incidents: [],
    buildingConfigurations: []
  });
  const [actionStatus, setActionStatus] = useState('');
  const [activeForm, setActiveForm] = useState<ActiveForm | null>(null);

  const devRoleSwitcher = true;

  const activeBuildingId = currentAccount?.buildingId ?? roleBuildingScope[role]?.[0] ?? 'b1';
  const buildingConfig = useMemo(() => resolveBuildingConfig(mvpData, activeBuildingId), [mvpData, activeBuildingId]);
  const visibleNav = useMemo(() => navItems.filter((item) => {
    if (!item.roles.includes(role)) return false;
    if (role === 'resident' && item.id === 'packages') return buildingConfig.packageManagement.enabled;
    if (role === 'resident' && item.id === 'facilities') return activeFacilities(buildingConfig).length > 0;
    if (role === 'resident' && item.id === 'my_levies') {
      return buildingConfig.residentPermissions.leviesVisibleTo === 'owners and tenants' || currentAccount?.title.toLowerCase().includes('owner');
    }
    return true;
  }), [role, buildingConfig, currentAccount]);

  function defaultPageForRole(nextRole: Role): PageId {
    const defaultPageByRole: Record<Role, PageId> = {
      super_admin: 'portfolio',
      portfolio_admin: 'portfolio',
      manager: 'portfolio',
      resident: 'resident',
      committee: 'committee',
      contractor: 'contractor'
    };
    return defaultPageByRole[nextRole];
  }

  useEffect(() => {
    if (!currentAccount) return;
    let active = true;
    async function loadWorkspace() {
      try {
        const diagnostic = await runSupabaseDiagnostic(currentAccount);
        if (active && !diagnostic.ok) setActionStatus(diagnostic.message);
        const latest = await loadMvpData(currentAccount, role);
        if (active) setMvpData(latest);
      } catch (error) {
        if (active) setActionStatus(error instanceof Error ? error.message : 'Could not load Supabase data.');
      }
    }
    void loadWorkspace();
    return () => {
      active = false;
    };
  }, [currentAccount, role]);

  useEffect(() => {
    if (page !== 'messages' || !currentAccount) return;
    let active = true;
    async function readMessages() {
      const result = await markMessagesRead(currentAccount);
      if (!active) return;
      if (!result.ok) {
        setActionStatus(result.message);
        return;
      }
      const latest = await loadMvpData(currentAccount, role);
      if (active) setMvpData(latest);
    }
    void readMessages();
    return () => {
      active = false;
    };
  }, [page, currentAccount, role]);

  async function loginAs(account: TestAccount) {
    const result = await signInTestAccount(account);
    setCurrentAccount(account);
    setRole(account.role);
    setPage(defaultPageForRole(account.role));
    setPublicView('app');
    setActionStatus(result.message);
  }

  async function switchRole(nextRole: Role) {
    const nextAccount = testAccounts.find((account) => account.role === nextRole) ?? currentAccount;
    if (nextAccount) {
      setCurrentAccount(nextAccount);
      const result = await signInTestAccount(nextAccount);
      setActionStatus(result.ok ? `Role switched. ${result.message}` : result.message);
    }
    setRole(nextRole);
    setPage(defaultPageForRole(nextRole));
  }

  async function runAction(action: () => Promise<MvpActionResult>) {
    const result = await action();
    if (currentAccount) {
      const latest = await loadMvpData(currentAccount, role);
      setMvpData(latest);
    }
    setActionStatus(cleanActionMessage(result.message));
  }

  const flowActions: FlowActions = {
    openForm: (kind: FormKind, context?: FormContext) => setActiveForm({ kind, context }),
    createBuilding: (payload: Record<string, string>) => runAction(() => createBuilding(currentAccount, payload)),
    reportIssue: (payload?: Partial<ReportIssue>) => runAction(() => createResidentIssue(currentAccount, payload)),
    assignContractor: (id?: string) => runAction(() => assignContractorToFirstJob(currentAccount, id)),
    updateMaintenanceStatus: (id: string, status: string, note?: string) => runAction(() => updateMaintenanceRequestStatus(currentAccount, id, status, note)),
    updateIssueStatus: (id: string, status: string) => runAction(() => updateReportIssueStatus(currentAccount, id, status)),
    notifyResident: (id: string) => runAction(() => updateReportIssueStatus(currentAccount, id, 'Under Review')),
    contractorUpdate: (id?: string, status = 'In Progress', note?: string) => runAction(() => addContractorUpdate(currentAccount, id, status, note)),
    createNotice: (payload?: Partial<Notice>) => runAction(() => createNotice(currentAccount, payload)),
    sendMessage: (payload?: Partial<SimpleRecord>) => runAction(() => sendResidentMessage(currentAccount, payload)),
    uploadDocument: (payload?: Partial<SimpleRecord> & { file?: File }) => runAction(() => uploadDocument(currentAccount, payload)),
    vote: (payload?: Partial<SimpleRecord>) => runAction(() => voteOnMotion(currentAccount, payload)),
    bookFacility: (payload?: Partial<SimpleRecord>) => runAction(() => bookFacility(currentAccount, payload)),
    submitRenovation: (payload?: Partial<SimpleRecord>) => runAction(() => submitRenovation(currentAccount, payload)),
    approveRenovation: (id: string) => runAction(() => updateRenovationStatus(currentAccount, id, 'Approved', 'Approved with standard noise conditions')),
    requestRenovationInfo: (id: string) => runAction(() => updateRenovationStatus(currentAccount, id, 'More Info Required', 'Acoustic certificate and contractor insurance requested')),
    updateFacilityBooking: (id: string, status: string) => runAction(() => updateFacilityBooking(currentAccount, id, status)),
    recordIncidentUpdate: (_id: string) => runAction(() => Promise.resolve({ ok: false, message: 'Incident persistence is not part of this Supabase pass yet.' })),
    saveBuildingConfig: (config: BuildingConfiguration, action: string) => runAction(() => updateBuildingConfiguration(currentAccount, config, action))
  };

  async function submitWorkflowForm(payload: Record<string, string | File>, context?: FormContext) {
    if (!activeForm) return;
    const targetId = context?.id;
    const field = (name: string) => typeof payload[name] === 'string' ? payload[name] as string : '';
    if (activeForm.kind === 'addBuilding') {
      await flowActions.createBuilding(stringPayload(payload));
    }
    if (activeForm.kind === 'sendMessage') {
      await flowActions.sendMessage({ title: field('title'), meta: field('body') });
    }
    if (activeForm.kind === 'createNotice') {
      const selectedBuilding = [...mvpData.buildings, ...buildings].find((building) => building.name === field('building'));
      await flowActions.createNotice({
        title: field('title'),
        buildingId: selectedBuilding?.id,
        category: field('category'),
        priority: field('priority') as Priority,
        body: field('body'),
        audience: field('audience'),
        publicationStatus: field('publicationStatus') as Notice['publicationStatus']
      });
    }
    if (activeForm.kind === 'uploadDocument') {
      const selectedBuilding = [...mvpData.buildings, ...buildings].find((building) => building.name === field('building'));
      await flowActions.uploadDocument({ title: field('title'), buildingId: selectedBuilding?.id, status: field('visibility'), meta: field('category'), due: field('url'), file: payload.file instanceof File ? payload.file : undefined });
    }
    if (activeForm.kind === 'reportIssue') {
      await flowActions.reportIssue({ title: field('title'), category: field('category') as ReportIssue['category'], severity: field('severity') as Priority, description: field('description') });
    }
    if (activeForm.kind === 'bookFacility') {
      await flowActions.bookFacility({ title: field('title'), due: field('date'), meta: field('notes') });
    }
    if (activeForm.kind === 'submitRenovation') {
      await flowActions.submitRenovation({ title: field('title'), due: field('date'), meta: field('scope') });
    }
    if (activeForm.kind === 'assignContractor') {
      await flowActions.assignContractor(targetId);
    }
    if (activeForm.kind === 'updateJobStatus' && targetId) {
      if (role === 'contractor') {
        await flowActions.contractorUpdate(targetId, field('status'), field('note'));
      } else {
        await flowActions.updateMaintenanceStatus(targetId, field('status'), field('note'));
      }
    }
    if (activeForm.kind === 'voteMotion') {
      await flowActions.vote({ id: targetId, meta: field('vote') });
    }
    setActiveForm(null);
  }

  if (publicView !== 'app') {
    return <PublicSite view={publicView} setView={setPublicView} loginAs={loginAs} />;
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-line bg-white/95 backdrop-blur xl:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <button className="flex items-center gap-3 text-left" onClick={() => setPage(defaultPageForRole(role))}>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-primary text-white shadow-soft">
              <AtlasMark className="h-7 w-7" />
            </span>
            <span>
              <span className="atlas-wordmark block text-base leading-none">ATLAS</span>
              <span className="block text-xs text-slate-500">{rolePermissions[role].scope}</span>
            </span>
          </button>
          <button className="xl:hidden icon-button" onClick={() => setSidebarOpen(false)} aria-label="Close navigation">
            <X size={18} />
          </button>
        </div>
        <nav className="h-[calc(100vh-4rem)] overflow-y-auto px-3 py-4">
          {visibleNav.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={`${item.id}-${item.label}`}
                onClick={() => {
                  setPage(item.id);
                  setSidebarOpen(false);
                }}
                className={`nav-item ${page === item.id ? 'nav-item-active' : ''}`}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>
      </aside>

      <div className="xl:pl-72">
        <header className="sticky top-0 z-30 border-b border-line bg-white/85 backdrop-blur">
          <div className="flex min-h-16 items-center gap-3 px-4 sm:px-6 lg:px-8">
            <button className="icon-button xl:hidden" onClick={() => setSidebarOpen(true)} aria-label="Open navigation">
              <Menu size={20} />
            </button>
            <div className="hidden flex-1 items-center gap-3 text-sm text-slate-500 md:flex">
              <Building2 size={17} />
              <span>{buildingConfig.profile.name}</span>
            </div>
            <div className="ml-auto hidden flex-col text-right sm:flex">
              <span className="text-sm font-semibold">{currentAccount?.name ?? 'Signed in'}</span>
              <span className="text-xs text-slate-500">{roleLabels[role]}</span>
            </div>
            {devRoleSwitcher && (
              <label className="flex items-center gap-2 rounded-full border border-line bg-white px-3 py-2 text-xs font-semibold text-slate-500 shadow-sm">
                <span className="hidden lg:inline">Switch Role</span>
                <select
                  value={role}
                  onChange={(event) => switchRole(event.target.value as Role)}
                  className="bg-transparent text-sm font-medium text-ink outline-none"
                >
                  {testAccounts.map((account) => (
                    <option key={account.id} value={account.role}>
                      {roleLabels[account.role]}
                    </option>
                  ))}
                </select>
              </label>
            )}
            <span className="hidden rounded-full bg-blue-50 px-3 py-2 text-xs font-semibold text-blue-700 ring-1 ring-blue-200 lg:inline-flex">
              Testing Mode
            </span>
            <div className="hidden h-10 w-10 place-items-center rounded-full bg-primary text-white sm:grid" aria-label="Atlas workspace">
              <AtlasMark className="h-7 w-7" />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          {actionStatus && (
            <div className="mb-4 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
              {actionStatus}
            </div>
          )}
          <PageRouter page={page} role={role} onNavigate={setPage} data={mvpData} actions={flowActions} buildingConfig={buildingConfig} />
        </main>
      </div>
      <WorkflowModal
        key={activeForm ? `${activeForm.kind}-${activeForm.context?.id ?? 'new'}` : 'closed'}
        activeForm={activeForm}
        role={role}
        data={mvpData}
        buildingConfig={buildingConfig}
        onClose={() => setActiveForm(null)}
        onSubmit={submitWorkflowForm}
      />
    </div>
  );
}

function PublicSite({
  view,
  setView,
  loginAs
}: {
  view: 'landing' | 'pricing' | 'login' | 'walkthrough';
  setView: (view: 'landing' | 'pricing' | 'login' | 'walkthrough' | 'app') => void;
  loginAs: (account: TestAccount) => void;
}) {
  function requestWalkthrough(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const subject = encodeURIComponent(`Atlas walkthrough request from ${String(form.get('company') ?? 'a strata company')}`);
    const body = encodeURIComponent([
      `Name: ${String(form.get('name') ?? '')}`,
      `Company: ${String(form.get('company') ?? '')}`,
      `Work email: ${String(form.get('email') ?? '')}`,
      `Buildings managed: ${String(form.get('buildings') ?? '')}`
    ].join('\n'));
    window.location.href = `mailto:hello@atlasstrata.com.au?subject=${subject}&body=${body}`;
  }

  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button className="flex items-center gap-3" onClick={() => setView('landing')}>
            <AtlasLogo markClassName="text-primary" wordmarkClassName="text-primary" />
          </button>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <button onClick={() => setView('landing')}>Product</button>
            <button onClick={() => setView('pricing')}>Pricing</button>
            <button onClick={() => setView('walkthrough')}>Request walkthrough</button>
          </div>
          <button className="btn-primary" onClick={() => setView('login')}>
            Login
          </button>
        </div>
      </header>

      {view === 'landing' && (
        <>
          <section className="hero">
            <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-10 px-4 py-10 sm:px-6 lg:grid-cols-[1fr_0.9fr] lg:px-8">
              <div>
                <span className="pill bg-white/10 text-white ring-white/20">Australian strata management platform</span>
                <AtlasLogo className="mt-6 text-white" markClassName="h-20 w-20 sm:h-24 sm:w-24" wordmarkClassName="text-5xl sm:text-6xl lg:text-7xl" tagline />
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                  A premium multi-tenant operating system for strata companies managing buildings, residents, committees,
                  contractors, levies, compliance and communications.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button className="btn-light" onClick={() => setView('walkthrough')}>
                    Request walkthrough <ArrowRight size={17} />
                  </button>
                </div>
              </div>
              <div className="dashboard-preview">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <AtlasLogo className="text-white" markClassName="h-8 w-8" wordmarkClassName="text-sm" />
                  <span className="pill bg-white/10 text-white ring-white/20">Strata management</span>
                </div>
                <div className="grid gap-3 p-5">
                  {['Building performance', 'Resident communications', 'Compliance risk', 'Committee governance'].map((item) => (
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4" key={item}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-200">{item}</span>
                        <CheckCircle2 className="text-emerald-200" size={18} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>
          <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
            <div className="grid gap-4 md:grid-cols-3">
              {[
                ['Portfolio clarity', 'See building profitability, risk, arrears, complaints and staff performance in one executive view.'],
                ['Resident simplicity', 'Mobile-first notices, issue reporting, bookings, building contacts and request tracking.'],
                ['Governance ready', 'Committee voting, digital resolutions, audit trails, contractor compliance and meeting records.']
              ].map(([title, copy]) => (
                <article className="rounded-3xl border border-line bg-white p-6 shadow-soft" key={title}>
                  <CheckCircle2 className="text-gum" />
                  <h2 className="mt-5 text-xl font-semibold">{title}</h2>
                  <p className="mt-3 text-sm leading-6 text-slate-600">{copy}</p>
                </article>
              ))}
            </div>
          </section>
        </>
      )}

      {view === 'pricing' && (
        <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6 lg:px-8">
          <SectionHeader eyebrow="Pricing" title="Plans for growing strata portfolios" action={<button className="btn-primary" onClick={() => setView('walkthrough')}>Request walkthrough</button>} />
          <div className="grid gap-5 md:grid-cols-3">
            {[
              ['Launch', '$899', 'Up to 15 buildings'],
              ['Scale', '$1,899', 'Up to 75 buildings'],
              ['Enterprise', 'Custom', 'Large strata networks']
            ].map(([name, price, detail]) => (
              <article className="rounded-3xl border border-line bg-white p-6 shadow-soft" key={name}>
                <h2 className="text-xl font-semibold">{name}</h2>
                <p className="mt-3 text-4xl font-semibold">{price}</p>
                <p className="mt-2 text-sm text-slate-500">{detail}</p>
                <ComingSoonButton label="Choose plan" />
              </article>
            ))}
          </div>
        </section>
      )}

      {view === 'login' && (
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="pill bg-navy text-white">Workspace access</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">Enter the Atlas workspace</h1>
            <p className="mt-4 text-slate-600">Choose a role profile to review the main Atlas workflows.</p>
          </div>
          <div className="grid gap-3 rounded-3xl border border-line bg-white p-4 shadow-soft">
            {testAccounts.map((account) => (
              <button key={account.id} className="flex w-full items-center justify-between rounded-2xl border border-transparent px-4 py-4 text-left hover:border-line hover:bg-slate-50" onClick={() => loginAs(account)}>
                <span>
                  <span className="block font-semibold">{account.name}</span>
                  <span className="block text-sm text-slate-500">{roleLabels[account.role]} · {account.email}</span>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        </section>
      )}

      {view === 'walkthrough' && (
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="pill bg-gold/10 text-gold ring-gold/20">Request walkthrough</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">Show Atlas to your portfolio team</h1>
            <p className="mt-4 text-slate-600">Tell us about your portfolio and we will tailor a walkthrough for your strata team.</p>
          </div>
          <form className="rounded-3xl border border-line bg-white p-6 shadow-soft" onSubmit={requestWalkthrough}>
            {[
              ['name', 'Name', 'text'],
              ['company', 'Company', 'text'],
              ['email', 'Work email', 'email'],
              ['buildings', 'Buildings managed', 'number']
            ].map(([name, label, type]) => (
              <label className="mb-4 block" key={name}>
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <input className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" name={name} type={type} placeholder={label} required />
              </label>
            ))}
            <button type="submit" className="w-full btn-primary">
              Send request
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function PageRouter({ page, role, onNavigate, data, actions, buildingConfig }: { page: PageId; role: Role; onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions; buildingConfig: BuildingConfiguration }) {
  if (page === 'portfolio' && role === 'super_admin') return <PlatformDashboard onNavigate={onNavigate} data={data} />;
  if (page === 'portfolio' && (role === 'manager' || role === 'portfolio_admin')) return <ManagerDashboard role={role} onNavigate={onNavigate} data={data} actions={actions} />;
  if (page === 'portfolio') return <PortfolioDashboard role={role} onNavigate={onNavigate} data={data} />;
  if (page === 'buildings') return <BuildingsPage role={role} data={data} actions={actions} onNavigate={onNavigate} />;
  if (page === 'building' && (role === 'manager' || role === 'portfolio_admin')) return <BuildingDashboard role={role} data={data} buildingConfig={buildingConfig} />;
  if (page === 'resident') return <ResidentDashboard role={role} onNavigate={onNavigate} data={data} actions={actions} buildingConfig={buildingConfig} />;
  if (page === 'committee') return <CommitteeDashboard role={role} onNavigate={onNavigate} data={data} actions={actions} />;
  if (page === 'motions') return <MotionsPage role={role} data={data} actions={actions} />;
  if (page === 'quotes') return <QuotesPage role={role} />;
  if (page === 'meetings') return <MeetingsPage role={role} />;
  if (page === 'contractor') return <ContractorDashboard role={role} data={data} actions={actions} />;
  if (page === 'communications') return <CommunicationsHub role={role} onNavigate={onNavigate} data={data} actions={actions} />;
  if (page === 'report_issue') return <ReportIssuePage role={role} data={data} actions={actions} buildingConfig={buildingConfig} />;
  if (page === 'directory') return <BuildingDirectoryPage role={role} buildingConfig={buildingConfig} data={data} />;
  if (page === 'my_levies') return <MyLeviesPage role={role} />;
  if (page === 'levy_management' && role === 'portfolio_admin') return <LevyManagementPage role={role} />;
  if (page === 'my_requests') return <MyRequestsPage role={role} data={data} actions={actions} />;
  if (page === 'messages') return <MessagesPage role={role} data={data} actions={actions} />;
  if (page === 'documents') return <DocumentsPage role={role} data={data} actions={actions} />;
  if (page === 'maintenance') return <MaintenancePage role={role} data={data} actions={actions} />;
  if (page === 'projects') return <ProjectsPage role={role} />;
  if (page === 'facilities') return <FacilitiesPage role={role} data={data} actions={actions} buildingConfig={buildingConfig} />;
  if (page === 'renovations') return <RenovationsPage role={role} data={data} actions={actions} buildingConfig={buildingConfig} />;
  if (page === 'packages' && role === 'resident') return <PackagesPage role={role} data={data} buildingConfig={buildingConfig} />;
  if (page === 'incidents') return <IncidentsPage role={role} data={data} actions={actions} />;
  if (page === 'compliance') return <CompliancePage role={role} buildingConfig={buildingConfig} />;
  if (page === 'building_settings' && role === 'manager') return <BuildingSettingsPage buildingConfig={buildingConfig} actions={actions} />;
  if (page === 'staff_performance') return <PerformancePage title="Staff Performance" eyebrow="Portfolio workload and response health" records={staffPerformanceRecords()} />;
  if (page === 'contractor_performance') return <PerformancePage title="Contractor Performance" eyebrow="Response time, compliance and job quality" records={contractorPerformanceRecords()} />;
  if (page === 'arrears_overview') return <LevyManagementPage role="portfolio_admin" />;
  if (page === 'compliance_risk') return <ModulePage title="Compliance Risk" eyebrow="Highest-risk compliance deadlines" records={complianceItems.filter((item) => item.status !== 'Open')} cta="Export risk report" />;
  if (page === 'reports') return <ReportsPage role={role} data={data} />;

  const moduleMap: Record<PageId, { title: string; eyebrow: string; records: SimpleRecord[]; cta: string }> = {
    public: { title: '', eyebrow: '', records: [], cta: '' },
    portfolio: { title: '', eyebrow: '', records: [], cta: '' },
    buildings: { title: '', eyebrow: '', records: [], cta: '' },
    building: { title: '', eyebrow: '', records: [], cta: '' },
    resident: { title: '', eyebrow: '', records: [], cta: '' },
    committee: { title: '', eyebrow: '', records: [], cta: '' },
    motions: { title: '', eyebrow: '', records: [], cta: '' },
    quotes: { title: '', eyebrow: '', records: [], cta: '' },
    meetings: { title: '', eyebrow: '', records: [], cta: '' },
    contractor: { title: '', eyebrow: '', records: [], cta: '' },
    staff_performance: { title: '', eyebrow: '', records: [], cta: '' },
    contractor_performance: { title: '', eyebrow: '', records: [], cta: '' },
    arrears_overview: { title: '', eyebrow: '', records: [], cta: '' },
    compliance_risk: { title: '', eyebrow: '', records: [], cta: '' },
    reports: { title: '', eyebrow: '', records: [], cta: '' },
    communications: { title: '', eyebrow: '', records: [], cta: '' },
    report_issue: { title: '', eyebrow: '', records: [], cta: '' },
    maintenance: { title: '', eyebrow: '', records: [], cta: '' },
    projects: { title: '', eyebrow: '', records: [], cta: '' },
    incidents: { title: 'Incident Register', eyebrow: 'Insurance, WHS and complaints', records: data.incidents, cta: 'Record incident' },
    compliance: { title: '', eyebrow: '', records: [], cta: '' },
    documents: { title: 'Documents Library', eyebrow: 'Permissions, versions, search and downloads', records: data.documents, cta: 'Upload document' },
    facilities: { title: '', eyebrow: '', records: [], cta: '' },
    building_settings: { title: '', eyebrow: '', records: [], cta: '' },
    renovations: { title: '', eyebrow: '', records: [], cta: '' },
    packages: { title: '', eyebrow: '', records: [], cta: '' },
    my_levies: { title: '', eyebrow: '', records: [], cta: '' },
    levy_management: { title: '', eyebrow: '', records: [], cta: '' },
    my_requests: { title: '', eyebrow: '', records: [], cta: '' },
    messages: { title: '', eyebrow: '', records: [], cta: '' },
    directory: { title: '', eyebrow: '', records: [], cta: '' },
    settings: { title: 'Settings', eyebrow: 'Company, subscription, feature flags and integrations', records: company.featureFlags.map((flag, index) => ({ id: `ff${index}`, title: flag, buildingId: 'b1', owner: 'Platform', status: 'Enabled', meta: flag.includes('placeholder') ? 'Coming Soon' : 'Feature flag' })), cta: 'Add feature flag' },
    users: { title: 'Companies', eyebrow: 'Tenant companies and platform access', records: [{ id: 'co1', title: 'Northshore Strata Co.', buildingId: 'b1', owner: 'Amelia Hart', status: 'Active', meta: 'Scale plan · 4 buildings' }], cta: 'Add company' },
    audit: { title: 'Audit Logs', eyebrow: 'User, role, action, entity and tenant context', records: data.auditLogs, cta: 'Export logs' }
  };

  const config = moduleMap[page];
  return <ModulePage {...config} records={filterForRole(config.records, role)} />;
}

function PlatformDashboard({ onNavigate, data }: { onNavigate: (page: PageId) => void; data: MvpData }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Platform" title="Atlas platform dashboard" action={<button className="btn-primary" onClick={() => onNavigate('users')}><Building2 size={17} /> View companies</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Companies" value="1" detail="Northshore Strata Co." icon={Building2} />
        <Metric title="Buildings" value={buildings.length.toString()} detail="490 lots under management" icon={Home} tone="blue" />
        <Metric title="Core records" value={(data.notices.length + data.reportIssues.length + data.maintenanceRequests.length).toString()} detail="Notices, issues, maintenance" icon={UserPlus} tone="green" />
        <Metric title="Revenue" value={currency(company.mrr)} detail="Monthly recurring revenue" icon={DollarSign} tone="amber" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Tenant health">
          <RecordTable records={[
            { id: 'th1', title: 'Northshore Strata Co.', buildingId: 'b1', owner: 'Amelia Hart', status: 'Active', due: 'Scale plan', meta: '4 buildings · 490 lots' },
            { id: 'th2', title: 'Feature flags', buildingId: 'b1', owner: 'Platform', status: 'Enabled', due: 'Testing', meta: company.featureFlags.join(', ') },
            { id: 'th3', title: 'Usage review', buildingId: 'b1', owner: 'System', status: 'Open', due: '2026-06-12', meta: `${company.usage}% active usage` }
          ]} />
        </Panel>
        <Panel title="Platform actions">
          <ActionList actions={[
            ['Review tenant usage', () => onNavigate('reports')],
            ['View tenant companies', () => onNavigate('users')],
            ['Inspect portfolio dashboard', () => onNavigate('portfolio')],
            ['View system reports', () => onNavigate('reports')]
          ]} />
        </Panel>
      </div>
    </div>
  );
}

type ManagerActionItem = {
  id: string;
  group: string;
  title: string;
  context: string;
  urgency: 'Critical' | 'High' | 'Medium' | 'Low';
  due?: string;
  actionLabel: string;
  onClick: () => void;
};

const managerUrgencyRank: Record<ManagerActionItem['urgency'], number> = {
  Critical: 0,
  High: 1,
  Medium: 2,
  Low: 3
};

function ManagerDashboard({ role, onNavigate, data, actions }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions }) {
  const unreadMessages = data.messages.filter((message) => message.status === 'Unread');
  const overdueRequests = data.maintenanceRequests.filter((request) => request.overdue && !['Completed', 'Closed', 'Rejected'].includes(request.status));
  const awaitingAssignment = data.maintenanceRequests.filter((request) => !request.contractorId && !request.overdue && !['Completed', 'Closed', 'Rejected'].includes(request.status));
  const contractorUpdates = [...data.contractorUpdates].sort((a, b) => recordTime(b.due) - recordTime(a.due)).slice(0, 6);
  const pendingBookings = data.facilityBookings.filter((booking) => ['Submitted', 'Pending', 'Requested'].includes(booking.status));
  const draftNotices = data.notices.filter((notice) => notice.publicationStatus === 'Draft');
  const documentsForReview = data.documents.filter((document) => ['Review', 'Pending review'].includes(document.status));
  const completedJobs = data.maintenanceRequests.filter((request) => ['Completed', 'Closed'].includes(request.status)).slice(0, 4);
  const approvedBookings = data.facilityBookings.filter((booking) => booking.status === 'Approved').slice(0, 4);
  const publishedNotices = data.notices.filter((notice) => notice.publicationStatus !== 'Draft').slice(0, 4);

  const attentionItems: ManagerActionItem[] = [
    ...unreadMessages.map((message) => ({
      id: `message-${message.id}`,
      group: 'Unread resident message',
      title: message.title,
      context: `${message.owner} · ${buildingName(message.buildingId)} · ${message.meta ?? 'New message'}`,
      urgency: messageRequiresImmediateResponse(message) ? 'Critical' as const : 'Medium' as const,
      due: message.due,
      actionLabel: 'Reply',
      onClick: () => onNavigate('messages')
    })),
    ...overdueRequests.map((request) => ({
      id: `overdue-${request.id}`,
      group: 'Overdue maintenance request',
      title: request.title,
      context: `${request.unit} · ${request.category} · ${request.status}`,
      urgency: request.priority === 'Emergency' ? 'Critical' as const : 'High' as const,
      due: request.submitted,
      actionLabel: request.contractorId ? 'Review job' : 'Assign contractor',
      onClick: () => request.contractorId
        ? onNavigate('maintenance')
        : actions.openForm('assignContractor', { id: request.id, title: request.title })
    })),
    ...awaitingAssignment.map((request) => ({
      id: `assignment-${request.id}`,
      group: 'Awaiting contractor assignment',
      title: request.title,
      context: `${request.unit} · ${request.category} · ${request.resident}`,
      urgency: request.priority === 'Emergency' ? 'Critical' as const : request.priority === 'High' ? 'High' as const : 'Medium' as const,
      due: request.submitted,
      actionLabel: 'Assign contractor',
      onClick: () => actions.openForm('assignContractor', { id: request.id, title: request.title })
    })),
    ...contractorUpdates.map((update) => ({
      id: `contractor-update-${update.id}`,
      group: 'Contractor update awaiting review',
      title: update.title,
      context: `${update.owner} · ${update.meta ?? 'Review update'}`,
      urgency: 'High' as const,
      due: update.due,
      actionLabel: 'Review job',
      onClick: () => onNavigate('maintenance')
    })),
    ...pendingBookings.map((booking) => ({
      id: `booking-${booking.id}`,
      group: 'Facility booking awaiting approval',
      title: booking.title,
      context: `${booking.owner} · ${formatDate(booking.due)} · ${booking.meta ?? 'Booking request'}`,
      urgency: 'High' as const,
      due: booking.due,
      actionLabel: 'Approve or reject',
      onClick: () => onNavigate('facilities')
    })),
    ...draftNotices.map((notice) => ({
      id: `draft-notice-${notice.id}`,
      group: 'Draft notice',
      title: notice.title,
      context: `${notice.audience} · ${notice.body.slice(0, 80)}`,
      urgency: 'Low' as const,
      due: notice.publishAt,
      actionLabel: 'Open communications',
      onClick: () => onNavigate('communications')
    })),
    ...documentsForReview.map((document) => ({
      id: `document-review-${document.id}`,
      group: 'Document visibility review',
      title: document.title,
      context: `${document.owner} · ${document.status} · ${document.meta ?? 'Document library'}`,
      urgency: 'Medium' as const,
      due: document.due,
      actionLabel: 'Review visibility',
      onClick: () => onNavigate('documents')
    }))
  ].sort(sortManagerActions);

  const recentItems: ManagerActionItem[] = [
    ...data.messages.slice(0, 2).map((message) => managerRecordAction(message, 'Latest resident message', 'Low', 'Open conversation', () => onNavigate('messages'))),
    ...data.maintenanceRequests.slice(0, 2).map((request) => ({
      id: `recent-maintenance-${request.id}`,
      group: 'Latest maintenance request',
      title: request.title,
      context: `${request.unit} · ${request.category} · ${request.status}`,
      urgency: request.priority === 'Emergency' ? 'Critical' as const : 'Low' as const,
      due: request.submitted,
      actionLabel: 'Open maintenance',
      onClick: () => onNavigate('maintenance')
    })),
    ...contractorUpdates.slice(0, 2).map((update) => managerRecordAction(update, 'Latest contractor update', 'Low', 'Review update', () => onNavigate('maintenance'))),
    ...data.facilityBookings.slice(0, 2).map((booking) => managerRecordAction(booking, 'Latest facility booking', 'Low', 'Open booking', () => onNavigate('facilities'))),
    ...data.notices.slice(0, 2).map((notice) => ({
      id: `recent-notice-${notice.id}`,
      group: 'Latest notice',
      title: notice.title,
      context: `${notice.category} · ${notice.audience}`,
      urgency: notice.priority === 'Emergency' ? 'Critical' as const : notice.priority,
      due: notice.publishAt,
      actionLabel: 'Open notice',
      onClick: () => onNavigate('communications')
    })),
    ...data.documents.slice(0, 2).map((document) => managerRecordAction(document, 'Latest uploaded document', 'Low', 'Open document', () => onNavigate('documents')))
  ].sort((a, b) => recordTime(b.due) - recordTime(a.due));

  const completedItems: ManagerActionItem[] = [
    ...completedJobs.map((request) => ({
      id: `completed-job-${request.id}`,
      group: 'Recently completed job',
      title: request.title,
      context: `${request.unit} · ${request.contractorId ? contractors.find((contractor) => contractor.id === request.contractorId)?.company : 'Contractor'} · ${request.status}`,
      urgency: 'Low' as const,
      due: request.submitted,
      actionLabel: 'Review history',
      onClick: () => onNavigate('maintenance')
    })),
    ...approvedBookings.map((booking) => managerRecordAction(booking, 'Recently approved booking', 'Low', 'View booking', () => onNavigate('facilities'))),
    ...publishedNotices.map((notice) => ({
      id: `published-notice-${notice.id}`,
      group: 'Recently published notice',
      title: notice.title,
      context: `${notice.category} · ${notice.reads} read receipt${notice.reads === 1 ? '' : 's'}`,
      urgency: 'Low' as const,
      due: notice.publishAt,
      actionLabel: 'View notice',
      onClick: () => onNavigate('communications')
    }))
  ].sort((a, b) => recordTime(b.due) - recordTime(a.due));

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={role === 'portfolio_admin' ? 'Portfolio admin' : 'Strata manager'}
        title="What needs attention right now?"
        action={<button className="btn-primary" onClick={() => actions.openForm('createNotice')}><Bell size={17} /> Create notice</button>}
      />
      <ManagerActionSection title="Attention required" items={attentionItems} emptyCopy="No unread messages, overdue work, pending bookings or workflow reviews." />
      <ManagerActionSection title="Recent activity" items={recentItems} emptyCopy="New resident, contractor and manager activity will appear here." />
      <ManagerActionSection title="Completed recently" items={completedItems} emptyCopy="Completed jobs, approved bookings and published notices will appear here." />
    </div>
  );
}

function ManagerActionSection({ title, items, emptyCopy }: { title: string; items: ManagerActionItem[]; emptyCopy: string }) {
  if (!items.length) {
    return (
      <Panel title={title}>
        <p className="py-6 text-sm text-slate-500">{emptyCopy}</p>
      </Panel>
    );
  }

  return (
    <Panel title={title}>
      <div className="divide-y divide-line">
        {items.map((item) => (
          <button key={item.id} className="grid w-full gap-4 py-4 text-left transition hover:bg-slate-50 sm:grid-cols-[140px_1fr_auto]" onClick={item.onClick}>
            <div className="flex items-start gap-2">
              <ManagerUrgencyBadge urgency={item.urgency} />
            </div>
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">{item.group}</p>
              <h3 className="mt-1 font-semibold text-ink">{item.title}</h3>
              <p className="mt-1 text-sm leading-6 text-slate-600">{item.context}</p>
              {item.due && <p className="mt-2 text-xs text-slate-500">{formatDate(item.due)}</p>}
            </div>
            <span className="inline-flex items-center justify-end gap-2 text-sm font-semibold text-harbour">
              {item.actionLabel}
              <ArrowRight size={16} />
            </span>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function ManagerUrgencyBadge({ urgency }: { urgency: ManagerActionItem['urgency'] }) {
  const classes: Record<ManagerActionItem['urgency'], string> = {
    Critical: 'bg-red-50 text-red-700 ring-red-200',
    High: 'bg-amber-50 text-amber-800 ring-amber-200',
    Medium: 'bg-blue-50 text-blue-700 ring-blue-200',
    Low: 'bg-slate-100 text-slate-700 ring-slate-200'
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes[urgency]}`}>{urgency}</span>;
}

function managerRecordAction(record: SimpleRecord, group: string, urgency: ManagerActionItem['urgency'], actionLabel: string, onClick: () => void): ManagerActionItem {
  return {
    id: `${group}-${record.id}`,
    group,
    title: record.title,
    context: `${record.owner} · ${record.status} · ${record.meta ?? buildingName(record.buildingId)}`,
    urgency,
    due: record.due,
    actionLabel,
    onClick
  };
}

function sortManagerActions(a: ManagerActionItem, b: ManagerActionItem) {
  return managerUrgencyRank[a.urgency] - managerUrgencyRank[b.urgency] || recordTime(b.due) - recordTime(a.due);
}

function messageRequiresImmediateResponse(message: SimpleRecord) {
  return /complaint|emergency|urgent|unsafe|danger/i.test(`${message.title} ${message.meta ?? ''}`);
}

function recordTime(value?: string) {
  const time = new Date(value ?? '').getTime();
  return Number.isFinite(time) ? time : 0;
}

function formatDate(value?: string) {
  if (!value) return 'No date set';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(time));
}

function formatDateTime(value?: string) {
  if (!value) return 'Time unavailable';
  const time = new Date(value).getTime();
  if (!Number.isFinite(time)) return value;
  return new Intl.DateTimeFormat('en-AU', {
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit'
  }).format(new Date(time));
}

function PortfolioDashboard({ role, onNavigate, data }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData }) {
  const scopedBuildings = data.buildings.length ? data.buildings : buildings;
  const openMaintenance = data.maintenanceRequests.filter((request) => !['Completed', 'Closed', 'Rejected'].includes(request.status));
  const overdue = openMaintenance.filter((request) => request.overdue);
  const unreadMessages = data.messages.filter((message) => message.status === 'Unread');
  const recentActivity = [
    ...data.notices.slice(0, 2).map(noticeToRecord),
    ...data.messages.slice(0, 2),
    ...data.documents.slice(0, 2)
  ];

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Atlas sandbox"
        title="Atlas Residences"
        action={<button className="btn-primary" onClick={() => onNavigate('messages')}><MessageSquare size={17} /> Test messages</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Building" value={scopedBuildings[0]?.name ?? 'Atlas Residences'} detail={`${scopedBuildings[0]?.lots ?? 100} lots`} icon={Building2} />
        <Metric title="Maintenance" value={openMaintenance.length.toString()} detail={`${overdue.length} overdue`} icon={HammerIcon} tone="amber" />
        <Metric title="Unread messages" value={unreadMessages.length.toString()} detail="Resident conversations" icon={MessageSquare} tone="blue" />
        <Metric title="Documents" value={data.documents.length.toString()} detail="Storage-backed files" icon={FileText} tone="green" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Workflow shortcuts">
          <div className="space-y-3">
            <ActionList actions={[
              ['Resident sends message', () => onNavigate('messages')],
              ['Resident reports issue', () => onNavigate('maintenance')],
              ['Manager publishes notice', () => onNavigate('communications')],
              ['Manager uploads document', () => onNavigate('documents')],
              ['Resident books BBQ Area', () => onNavigate('facilities')]
            ]} />
          </div>
        </Panel>
        <Panel title="Recent activity">
          <RecordTable records={recentActivity} />
        </Panel>
      </div>
    </div>
  );
}

function BuildingsPage({ role, data, actions, onNavigate }: { role: Role; data: MvpData; actions: FlowActions; onNavigate: (page: PageId) => void }) {
  const availableBuildings = data.buildings.length ? data.buildings : buildings;
  const scopedBuildings = role === 'manager' && !data.buildings.length ? availableBuildings.slice(0, 2) : availableBuildings;
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Buildings" title="Managed schemes" action={<button className="btn-primary" onClick={() => actions.openForm('addBuilding')}><Plus size={17} /> Add building</button>} />
      <div className="grid gap-4 lg:grid-cols-2">
        {scopedBuildings.map((building) => (
          <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={building.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{building.name}</h2>
                <p className="mt-1 text-sm text-slate-500">{building.address}</p>
              </div>
              <Badge label={`${building.lots} lots`} tone="Low" />
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Manager" value={building.manager} />
              <MiniStat label="Open jobs" value={data.maintenanceRequests.filter((request) => request.buildingId === building.id && request.status !== 'Closed').length.toString()} />
              <MiniStat label="Compliance" value={complianceItems.filter((item) => item.buildingId === building.id && item.status === 'Overdue').length ? 'At risk' : 'On track'} />
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => onNavigate('building')}><Eye size={16} /> Open building</button>
              {role === 'manager' && <button className="btn-secondary" onClick={() => onNavigate('building_settings')}><ShieldCheck size={16} /> Configure</button>}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function BuildingDashboard({ role, data, buildingConfig }: { role: Role; data: MvpData; buildingConfig: BuildingConfiguration }) {
  const building = role === 'manager' ? buildings[0] : buildings[3];
  const dashboardConfig = role === 'manager' ? buildingConfig : resolveBuildingConfig(data, building.id);
  const buildingMaintenance = data.maintenanceRequests.filter((request) => request.buildingId === building.id);
  const buildingNotices = data.notices.filter((notice) => notice.buildingId === building.id);
  const activeCompliance = dashboardConfig.compliance.filter((item) => item.enabled);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Building dashboard" title={building.name} action={<ComingSoonButton primary icon={<Bell size={17} />} label="Create alert" />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Lots" value={building.lots.toString()} detail={building.address} icon={Building2} />
        <Metric title="Open issues" value={buildingMaintenance.filter((item) => item.status !== 'Closed').length.toString()} detail="Maintenance and incidents" icon={AlertTriangle} tone="amber" />
        <Metric title="Active projects" value={projects.filter((project) => project.buildingId === building.id).length.toString()} detail="Committee visible" icon={Vote} tone="blue" />
        <Metric title="Compliance scope" value={activeCompliance.length.toString()} detail="Configured requirements" icon={ShieldCheck} tone="red" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Building profile">
          <DetailRows rows={[
            ['Address', building.address],
            ['Assigned manager', building.manager],
            ['Committee members', committeeMembers.filter((person) => person.buildingId === building.id).map((person) => person.name).join(', ') || '4 seeded members'],
            ['Facility bookings', data.facilityBookings.filter((item) => item.buildingId === building.id).length.toString()],
            ['Documents', data.documents.filter((item) => item.buildingId === building.id).length.toString()]
          ]} />
        </Panel>
        <DirectoryPanel buildingConfig={dashboardConfig} role={role} />
        <Panel title="Upcoming and active" className="xl:col-span-2">
          <RecordTable records={[...buildingNotices.slice(0, 3).map(noticeToRecord), ...buildingMaintenance.slice(0, 3).map(maintenanceToRecord)]} />
        </Panel>
      </div>
    </div>
  );
}

function ResidentDashboard({ role, onNavigate, data, actions, buildingConfig }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions; buildingConfig: BuildingConfiguration }) {
  const latestNotice = data.notices[0];
  const openRequests = data.maintenanceRequests.filter((request) => !['Completed', 'Closed', 'Rejected'].includes(request.status));
  const latestMessages = data.messages.slice(0, 3);
  const latestBooking = data.facilityBookings[0];
  const recentDocuments = data.documents.slice(0, 3);

  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <SectionHeader eyebrow="Resident home" title={buildingConfig.profile.name} action={<button className="btn-primary" onClick={() => actions.openForm('reportIssue')}><Plus size={17} /> Report issue</button>} />
      <div className="grid gap-5 lg:grid-cols-2">
        <Panel title="Latest notice" className="lg:col-span-2">
          {latestNotice ? (
            <button className="flex w-full items-start justify-between gap-4 py-2 text-left" onClick={() => onNavigate('communications')}>
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <Badge label={latestNotice.category} tone={latestNotice.priority} />
                  <span className="text-xs text-slate-500">{formatDate(latestNotice.publishAt)}</span>
                </div>
                <h2 className="mt-3 text-lg font-semibold">{latestNotice.title}</h2>
                <p className="mt-2 line-clamp-2 text-sm leading-6 text-slate-600">{latestNotice.body}</p>
              </div>
              <ArrowRight className="mt-1 shrink-0 text-harbour" size={18} />
            </button>
          ) : <ResidentEmpty copy="There are no current building notices." action="View notices" onClick={() => onNavigate('communications')} />}
        </Panel>

        <Panel title="Open maintenance requests">
          {openRequests.length ? (
            <div className="divide-y divide-line">
              {openRequests.slice(0, 3).map((request) => (
                <button className="flex w-full items-center justify-between gap-4 py-3 text-left" key={request.id} onClick={() => onNavigate('my_requests')}>
                  <div>
                    <p className="font-semibold">{request.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{request.status} · Updated {formatDate(request.submitted)}</p>
                  </div>
                  <Badge label={request.status} tone={request.priority} />
                </button>
              ))}
            </div>
          ) : <ResidentEmpty copy="You have no open maintenance requests." action="Report an issue" onClick={() => actions.openForm('reportIssue')} />}
        </Panel>

        <Panel title="Messages" action={<button className="text-sm font-semibold text-harbour" onClick={() => actions.openForm('sendMessage')}>Message manager</button>}>
          {latestMessages.length ? (
            <div className="divide-y divide-line">
              {latestMessages.map((message) => (
                <button className="flex w-full items-center justify-between gap-4 py-3 text-left" key={message.id} onClick={() => onNavigate('messages')}>
                  <div>
                    <p className="font-semibold">{message.title}</p>
                    <p className="mt-1 line-clamp-1 text-sm text-slate-500">{message.meta}</p>
                  </div>
                  <div className="text-right">
                    {message.status === 'Unread' && <Badge label="Unread" />}
                    <p className="mt-1 text-xs text-slate-400">{formatDate(message.due)}</p>
                  </div>
                </button>
              ))}
            </div>
          ) : <ResidentEmpty copy="No messages yet." action="Message manager" onClick={() => actions.openForm('sendMessage')} />}
        </Panel>

        <Panel title="Facility bookings">
          {latestBooking ? (
            <button className="flex w-full items-center justify-between gap-4 py-2 text-left" onClick={() => onNavigate('facilities')}>
              <div>
                <p className="font-semibold">{latestBooking.title}</p>
                <p className="mt-1 text-sm text-slate-500">{formatDate(latestBooking.due)}</p>
              </div>
              <Badge label={latestBooking.status} />
            </button>
          ) : <ResidentEmpty copy="You have no facility bookings." action="Request a booking" onClick={() => onNavigate('facilities')} />}
        </Panel>

        <Panel title="Recent documents" action={<button className="text-sm font-semibold text-harbour" onClick={() => onNavigate('documents')}>View all</button>}>
          {recentDocuments.length ? (
            <div className="divide-y divide-line">
              {recentDocuments.map((document) => (
                <button className="flex w-full items-center justify-between gap-4 py-3 text-left" key={document.id} onClick={() => onNavigate('documents')}>
                  <div>
                    <p className="font-semibold">{document.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{document.meta} · {formatDate(document.due)}</p>
                  </div>
                  <FileText className="shrink-0 text-harbour" size={18} />
                </button>
              ))}
            </div>
          ) : <ResidentEmpty copy="No building documents are available yet." action="Open documents" onClick={() => onNavigate('documents')} />}
        </Panel>
      </div>
    </div>
  );
}

function ResidentEmpty({ copy, action, onClick }: { copy: string; action: string; onClick: () => void }) {
  return (
    <div className="flex items-center justify-between gap-4 py-3">
      <p className="text-sm text-slate-500">{copy}</p>
      <button className="shrink-0 text-sm font-semibold text-harbour" onClick={onClick}>{action}</button>
    </div>
  );
}

function CommitteeDashboard({ role, onNavigate, data, actions }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Committee governance" title="Decisions, motions and financial oversight" action={<button className="btn-primary" onClick={() => onNavigate('documents')}><FileText size={17} /> Committee documents</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Open motions" value={data.motions.length.toString()} detail="Votes and resolutions" icon={Vote} />
        <Metric title="Quotes awaiting approval" value="3" detail="Major works" icon={DollarSign} tone="amber" />
        <Metric title="Committee docs" value="12" detail="Restricted visibility" icon={FileText} tone="blue" />
        <Metric title="Capital works" value={currency(680000)} detail="Budget under review" icon={ShieldCheck} tone="green" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1fr_0.8fr]">
        <ModulePage title="Committee matters" eyebrow="Voting, expenditure approvals and digital resolutions" records={filterForRole([...data.motions, ...projects.map(projectToRecord), ...data.documents], role)} cta="Add committee item" compact />
        <Panel title="Vote on motions">
          <div className="space-y-3">
            {data.motions.map((motion) => (
              <div className="rounded-2xl border border-line p-4" key={motion.id}>
                <h3 className="font-semibold">{motion.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{motion.meta}</p>
                <div className="mt-4 flex gap-2">
                  <button className="btn-secondary" onClick={() => actions.openForm('voteMotion', { id: motion.id, title: motion.title })}>Vote</button>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function ContractorDashboard({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const assigned = data.maintenanceRequests.filter((request) => request.contractorId);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Contractor portal" title="Assigned Atlas Residences job" />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Assigned jobs" value={assigned.length.toString()} detail="Only contractor-visible work" icon={Clock3} />
        <Metric title="In progress" value={assigned.filter((item) => item.status === 'In Progress').length.toString()} detail="Status updates persist" icon={CheckCircle2} tone="blue" />
      </div>
      <MaintenanceCards
        requests={assigned}
        contractorView
        onContractorUpdate={(id, status) => actions.openForm('updateJobStatus', { id, status, title: assigned.find((request) => request.id === id)?.title })}
        onStatusUpdate={(id, status) => actions.openForm('updateJobStatus', { id, status, title: assigned.find((request) => request.id === id)?.title })}
      />
    </div>
  );
}

function CommunicationsHub({ role, onNavigate, data, actions }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions }) {
  const scopedNotices = data.notices;

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Notices" title="Atlas Residences notices" action={(role === 'manager' || role === 'portfolio_admin' || role === 'super_admin') ? <button className="btn-primary" onClick={() => actions.openForm('createNotice')}><Plus size={17} /> Create notice</button> : undefined} />
      <Panel title={(role === 'manager' || role === 'portfolio_admin' || role === 'super_admin') ? 'Notices' : 'Published notices'}>
        {scopedNotices.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {scopedNotices.map((notice) => <NoticeCard notice={notice} role={role} key={notice.id} />)}
          </div>
        ) : <EmptyState title="No notices yet" copy="Managers can create the first Atlas Residences notice from this page." />}
      </Panel>
    </div>
  );
}

function ReportIssuePage({ role, data, actions, buildingConfig }: { role: Role; data: MvpData; actions: FlowActions; buildingConfig: BuildingConfiguration }) {
  const scopedIssues = data.reportIssues;
  const categories = enabledIssueCategories(buildingConfig);

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="Report Issue" title="One simple flow for residents" action={<button className="btn-primary" onClick={() => actions.openForm('reportIssue')}><Plus size={17} /> Submit issue</button>} />
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Available issue categories">
          <div className="grid gap-3">
            <div className="grid grid-cols-2 gap-2">
              {categories.map((category) => (
                <div className="rounded-2xl border border-line px-3 py-3 text-sm font-semibold" key={category.id}>
                  <span>{category.label}</span>
                  <span className="mt-1 block text-xs font-medium text-slate-400">Default priority: {category.defaultPriority}</span>
                </div>
              ))}
            </div>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              {buildingConfig.profile.name} only shows issue categories enabled for this building. The system routes each report into maintenance, incidents, or both based on category and severity.
            </div>
            <button className="btn-primary justify-center" onClick={() => actions.openForm('reportIssue')}><Plus size={17} /> Start report</button>
          </div>
        </Panel>
        <Panel title="Your tracked issues">
          <ReportIssueList issues={scopedIssues} />
        </Panel>
      </div>
    </div>
  );
}

function BuildingDirectoryPage({ role, buildingConfig, data }: { role: Role; buildingConfig: BuildingConfiguration; data: MvpData }) {
  const visible = visibleContacts(buildingConfig, role);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Building Directory" title={`${buildingConfig.profile.name} contacts`} action={role === 'manager' ? <span className="pill bg-blue-50 text-blue-700 ring-blue-200">Managed in Building Settings</span> : undefined} />
      <div className="grid gap-5 lg:grid-cols-2">
        {visible.length ? (
          <DirectoryPanel buildingConfig={buildingConfig} role={role} className="lg:col-span-2" />
        ) : (
          <Panel title="Contacts">
            <EmptyState title="No contacts configured" copy="Building contacts will appear here once the strata manager adds them in Building Settings." />
          </Panel>
        )}
        {(role === 'manager' || role === 'portfolio_admin') && (
          <Panel title="Configured buildings">
            <RecordTable records={data.buildingConfigurations.map((config) => ({
              id: config.buildingId,
              title: config.profile.name,
              buildingId: config.buildingId,
              owner: config.profile.buildingType,
              status: config.packageManagement.enabled ? 'Package enabled' : 'Package disabled',
              meta: `${activeFacilities(config).length} facilities · ${config.contacts.length} contacts`
            }))} />
          </Panel>
        )}
      </div>
    </div>
  );
}

function MyLeviesPage({ role }: { role: Role }) {
  const ownLevy = levies.find((levy) => levy.buildingId === 'b1' && levy.lot === '1A') ?? levies[0];
  const committeeSummary = levySummaryByBuilding().filter((summary) => summary.buildingId === 'b1');

  if (role === 'committee') {
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Levy Summary" title="Building levy position" action={<span className="pill bg-blue-50 text-blue-700 ring-blue-200">Private owner details hidden</span>} />
        <Panel title="Harbourline Residences summary">
          <RecordTable records={committeeSummary.map(summaryToRecord)} />
        </Panel>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="My Levies" title="Lot 1A levy account" action={<ComingSoonButton primary icon={<Download size={17} />} label="Download latest notice" />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Current balance" value={currency(ownLevy.currentBalance)} detail="Lot 1A only" icon={DollarSign} />
        <Metric title="Next due date" value={ownLevy.nextDueDate} detail="Q3 levy notice" icon={CalendarDays} tone="blue" />
        <Metric title="Outstanding" value={currency(ownLevy.outstandingAmount)} detail={ownLevy.status} icon={AlertTriangle} tone={ownLevy.outstandingAmount > 0 ? 'red' : 'green'} />
        <Metric title="Reminder status" value={ownLevy.reminderStatus} detail="Email and in-app" icon={Bell} tone="amber" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Latest levy notice">
          <DetailRows rows={[
            ['Building', buildingName(ownLevy.buildingId)],
            ['Lot/unit', ownLevy.lot],
            ['File', ownLevy.latestNotice],
            ['Visibility', 'Only this owner/resident account']
          ]} />
        </Panel>
        <Panel title="Payment history">
          <RecordTable records={[
            { id: `${ownLevy.id}-payment-1`, title: 'Latest payment received', buildingId: ownLevy.buildingId, owner: 'Lot 1A', status: 'Paid', due: ownLevy.lastPaymentDate, amount: ownLevy.lastPaymentAmount, meta: 'Manual reconciliation' },
            { id: `${ownLevy.id}-payment-2`, title: 'Previous quarter levy', buildingId: ownLevy.buildingId, owner: 'Lot 1A', status: 'Paid', due: '2026-02-04', amount: 1180, meta: 'Receipt available' }
          ]} />
        </Panel>
      </div>
    </div>
  );
}

function PortfolioLevySummary() {
  return <RecordTable records={levySummaryByBuilding().sort((a, b) => b.totalArrears - a.totalArrears).map(summaryToRecord)} />;
}

function LevyManagementPage({ role }: { role: Role }) {
  const summaries = levySummaryByBuilding().filter((summary) => {
    if (role === 'manager') return ['b1', 'b2'].includes(summary.buildingId);
    return true;
  });
  const visibleLevies = levies.filter((levy) => role === 'manager' ? ['b1', 'b2'].includes(levy.buildingId) : true);

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={role === 'portfolio_admin' ? 'Portfolio levy risk' : 'Levy Management'} title={role === 'portfolio_admin' ? 'Company-wide arrears summary' : 'Assigned building levy operations'} action={<ComingSoonButton primary icon={<Download size={17} />} label="Export arrears report" />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Total arrears" value={currency(summaries.reduce((total, summary) => total + summary.totalArrears, 0))} detail="Across visible buildings" icon={DollarSign} tone="red" />
        <Metric title="Overdue lots" value={summaries.reduce((total, summary) => total + summary.overdueLots, 0).toString()} detail="Requires follow-up" icon={AlertTriangle} tone="amber" />
        <Metric title="Notices issued" value={visibleLevies.length.toString()} detail="Current quarter" icon={FileText} tone="blue" />
        <Metric title="Recent payments" value={visibleLevies.filter((levy) => levy.status === 'Paid').length.toString()} detail="Reconciled manually" icon={CheckCircle2} tone="green" />
      </div>
      <Panel title={role === 'portfolio_admin' ? 'Highest-risk buildings' : 'Building arrears'}>
        <RecordTable records={summaries.sort((a, b) => b.totalArrears - a.totalArrears).map(summaryToRecord)} />
      </Panel>
      {role === 'manager' && (
        <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
          <Panel title="Manager actions">
            <ActionList actions={[
              ['Upload levy batch', 'deferred'],
              ['Import CSV', 'deferred'],
              ['Upload levy notices', 'deferred'],
              ['Mark paid/unpaid', 'deferred'],
              ['Send reminder', 'deferred']
            ]} />
          </Panel>
          <Panel title="Overdue lots">
            <RecordTable records={visibleLevies.filter((levy) => levy.status === 'Overdue').map(levyToPrivateRecord)} />
          </Panel>
        </div>
      )}
    </div>
  );
}

function MyRequestsPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="My Requests" title="Track reported issues" action={<button className="btn-primary" onClick={() => actions.openForm('reportIssue')}><Plus size={17} /> Report issue</button>} />
      <MaintenanceCards requests={data.maintenanceRequests} />
    </div>
  );
}

function MessagesPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const records = role === 'contractor'
    ? contractorMessageRecords(data.maintenanceRequests)
    : data.messages;
  const accountName = testAccounts.find((account) => account.role === role)?.name ?? '';
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="Messages" title={role === 'manager' ? 'Resident conversation' : 'Message your strata manager'} action={(role === 'resident' || role === 'committee' || role === 'manager') ? <button className="btn-primary" onClick={() => actions.openForm('sendMessage')}><MessageSquare size={17} /> {role === 'manager' ? 'Reply' : 'Send message'}</button> : undefined} />
      <Panel title="Conversation history">
        <MessageThread records={records} accountName={accountName} />
      </Panel>
    </div>
  );
}

function DocumentsPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const [query, setQuery] = useState('');
  const records = role === 'contractor'
    ? contractorDocumentRecords(data.maintenanceRequests)
    : data.documents;
  const filtered = records.filter((record) => `${record.title} ${record.meta ?? ''}`.toLowerCase().includes(query.trim().toLowerCase()));
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Documents"
        title={role === 'resident' ? 'Building documents' : 'Document library'}
        action={(role === 'manager' || role === 'portfolio_admin') ? <button className="btn-primary" onClick={() => actions.openForm('uploadDocument')}><Plus size={17} /> Upload document</button> : undefined}
      />
      <Panel title="Available documents" action={records.length ? <span className="text-sm text-slate-500">{records.length} file{records.length === 1 ? '' : 's'}</span> : undefined}>
        <label className="mb-5 flex items-center gap-3 rounded-2xl border border-line bg-slate-50 px-4 py-3">
          <Search size={17} className="text-slate-400" />
          <input className="w-full bg-transparent text-sm outline-none" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search documents by name or category" />
        </label>
        <DocumentList records={filtered} />
      </Panel>
    </div>
  );
}

function MessageThread({ records, accountName }: { records: SimpleRecord[]; accountName: string }) {
  if (!records.length) {
    return <EmptyState title="No messages yet" copy="Start a conversation and replies will remain here after refresh." />;
  }

  return (
    <div className="space-y-4">
      {[...records].sort((a, b) => recordTime(a.due) - recordTime(b.due)).map((message) => {
        const isOwnMessage = message.owner === accountName;
        return (
          <article className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`} key={message.id}>
            <div className={`max-w-[88%] rounded-2xl px-4 py-3 sm:max-w-[72%] ${isOwnMessage ? 'bg-primary text-white' : 'border border-line bg-slate-50 text-ink'}`}>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className={`text-xs font-semibold ${isOwnMessage ? 'text-white/75' : 'text-slate-500'}`}>{isOwnMessage ? 'You' : message.owner}</p>
                {message.status === 'Unread' && !isOwnMessage && <span className="rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-semibold text-red-700">Unread</span>}
              </div>
              <p className="mt-1 font-semibold">{message.title}</p>
              <p className={`mt-2 text-sm leading-6 ${isOwnMessage ? 'text-white/90' : 'text-slate-600'}`}>{message.meta}</p>
              <p className={`mt-2 text-xs ${isOwnMessage ? 'text-white/65' : 'text-slate-400'}`}>{formatDateTime(message.due)}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}

function DocumentList({ records }: { records: SimpleRecord[] }) {
  if (!records.length) {
    return <EmptyState title="No documents found" copy="Try another search, or upload the first building document." />;
  }

  return (
    <div className="divide-y divide-line">
      {records.map((document) => (
        <article className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between" key={document.id}>
          <div className="flex min-w-0 items-start gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-harbour">
              <FileText size={18} />
            </span>
            <div className="min-w-0">
              <h3 className="truncate font-semibold">{document.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{document.meta} · Uploaded {formatDate(document.due)}</p>
              <div className="mt-2"><Badge label={document.status} /></div>
            </div>
          </div>
          {document.href ? (
            <div className="flex shrink-0 gap-2">
              <a className="btn-secondary" href={document.href} target="_blank" rel="noreferrer"><Eye size={16} /> View</a>
              <a className="btn-secondary" href={document.href} download><Download size={16} /> Download</a>
            </div>
          ) : <span className="text-sm text-slate-500">File unavailable</span>}
        </article>
      ))}
    </div>
  );
}

function MaintenancePage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  if (role === 'contractor') {
    const assigned = filterForRole(data.maintenanceRequests, 'contractor');
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Assigned Jobs" title="LiftCare NSW work queue" />
        <MaintenanceCards
          requests={assigned}
          contractorView
          onContractorUpdate={(id, status) => actions.openForm('updateJobStatus', { id, status, title: assigned.find((request) => request.id === id)?.title })}
          onStatusUpdate={(id, status) => actions.openForm('updateJobStatus', { id, status, title: assigned.find((request) => request.id === id)?.title })}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Maintenance" title="Issue triage and contractor assignment" />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Resident issues to triage">
          <ReportIssueList issues={data.reportIssues} managerView actions={actions} />
        </Panel>
        <Panel title="Maintenance jobs">
          <MaintenanceCards
            requests={data.maintenanceRequests}
            compact
            onAssignContractor={(id) => actions.openForm('assignContractor', { id, title: data.maintenanceRequests.find((request) => request.id === id)?.title })}
            onStatusUpdate={(id, status) => actions.openForm('updateJobStatus', { id, status, title: data.maintenanceRequests.find((request) => request.id === id)?.title })}
          />
        </Panel>
      </div>
    </div>
  );
}

function FacilitiesPage({ role, data, actions, buildingConfig }: { role: Role; data: MvpData; actions: FlowActions; buildingConfig: BuildingConfiguration }) {
  const records = data.facilityBookings;
  const facilities = activeFacilities(buildingConfig);
  const residentCanBook = facilities.length > 0;
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Facility Bookings"
        title="Facility bookings"
        action={role === 'resident' && residentCanBook ? <button className="btn-primary" onClick={() => actions.openForm('bookFacility')}><Plus size={17} /> Request booking</button> : undefined}
      />
      {role === 'resident' && (
        facilities.length ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {facilities.map((facility) => (
              <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={facility.id}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{facility.name}</h2>
                    <p className="mt-1 text-sm text-slate-500">{facility.location} · Capacity {facility.capacity}</p>
                  </div>
                  <Badge label={facility.approvalRequired ? 'Approval required' : 'Instant'} />
                </div>
                <p className="mt-3 text-sm leading-6 text-slate-600">{facility.description}</p>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  <MiniStat label="Availability" value={facility.availability} />
                  <MiniStat label="Max length" value={facility.maxBookingLength} />
                  <MiniStat label="Notice" value={facility.advanceNotice} />
                  <MiniStat label="Visibility" value={facility.visibility} />
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState title="No facilities available for booking" copy="This building has no active resident-bookable facilities configured." />
        )
      )}
      {role === 'resident' && (
        <Panel title="My bookings">
          {records.length ? (
            <div className="divide-y divide-line">
              {records.map((booking) => (
                <div className="flex items-center justify-between gap-4 py-4" key={booking.id}>
                  <div>
                    <p className="font-semibold">{booking.title}</p>
                    <p className="mt-1 text-sm text-slate-500">{formatDate(booking.due)}</p>
                    {booking.meta && <p className="mt-1 text-sm text-slate-600">{booking.meta}</p>}
                  </div>
                  <Badge label={booking.status} />
                </div>
              ))}
            </div>
          ) : <ResidentEmpty copy="You have no facility bookings." action="Request a booking" onClick={() => actions.openForm('bookFacility')} />}
        </Panel>
      )}
      {(role === 'manager' || role === 'portfolio_admin' || role === 'super_admin') && (
        <Panel title="Booking requests">
          <div className="divide-y divide-line">
            {records.length ? records.map((booking) => (
              <article className="flex flex-col gap-4 py-4 sm:flex-row sm:items-center sm:justify-between" key={booking.id}>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{booking.title}</h3>
                    <Badge label={booking.status} />
                  </div>
                  <p className="mt-1 text-sm text-slate-500">{booking.owner} · {formatDate(booking.due)}</p>
                  <p className="mt-2 text-sm text-slate-600">{booking.meta}</p>
                </div>
                {['Submitted', 'Pending', 'Requested'].includes(booking.status) && (
                  <div className="flex shrink-0 flex-wrap gap-2">
                    <button className="btn-secondary" onClick={() => actions.updateFacilityBooking(booking.id, 'Approved')}>Approve</button>
                    <button className="btn-secondary" onClick={() => actions.updateFacilityBooking(booking.id, 'Rejected')}>Reject</button>
                  </div>
                )}
              </article>
            )) : <EmptyState title="No booking requests" copy="Resident BBQ Area requests will appear here for approval." />}
          </div>
        </Panel>
      )}
    </div>
  );
}

function RenovationsPage({ role, data, actions, buildingConfig }: { role: Role; data: MvpData; actions: FlowActions; buildingConfig: BuildingConfiguration }) {
  const records = filterForRole(data.renovations, role);
  const rules = activeRenovationRules(buildingConfig);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Renovation Approvals"
        title={role === 'resident' || role === 'committee' ? `${buildingConfig.profile.name} renovation requests` : 'Review renovation requests'}
        action={(role === 'resident' || role === 'committee') && rules.length ? <button className="btn-primary" onClick={() => actions.openForm('submitRenovation')}><Plus size={17} /> Submit request</button> : undefined}
      />
      {(role === 'resident' || role === 'committee') && (
        rules.length ? (
          <Panel title="Available request types">
            <RecordTable records={rules.map((rule) => ({
              id: rule.id,
              title: rule.type,
              buildingId: buildingConfig.buildingId,
              owner: rule.committeeReviewRequired ? 'Committee review' : 'Manager review',
              status: rule.approvalPathway,
              meta: `${rule.requiredDocuments.join(', ')} · ${rule.noiseRules}`
            }))} />
          </Panel>
        ) : (
          <EmptyState title="No renovation pathways configured" copy="This building has no resident renovation request types enabled." />
        )
      )}
      <div className="grid gap-4 lg:grid-cols-2">
        {records.map((renovation) => (
          <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={renovation.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge label={renovation.status} />
              <span className="text-xs text-slate-500">{renovation.due}</span>
            </div>
            <h3 className="mt-3 font-semibold">{renovation.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{buildingName(renovation.buildingId)} · {renovation.owner}</p>
            <p className="mt-3 text-sm text-slate-600">{renovation.meta}</p>
            {(role === 'manager' || role === 'portfolio_admin') && (
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={() => actions.approveRenovation(renovation.id)}>Approve</button>
                <button className="btn-secondary" onClick={() => actions.requestRenovationInfo(renovation.id)}>Request info</button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  );
}

function PackagesPage({ role, data, buildingConfig }: { role: Role; data: MvpData; buildingConfig: BuildingConfiguration }) {
  if (!buildingConfig.packageManagement.enabled) {
    return (
      <div className="mx-auto max-w-5xl space-y-6">
        <SectionHeader eyebrow="Packages" title="Package management unavailable" />
        <EmptyState title="No package collection for this building" copy={`${buildingConfig.profile.name} does not have concierge/package collection enabled.`} />
      </div>
    );
  }
  const records = filterPrivateForRole(data.packages, role).filter((pkg) => pkg.status === 'Awaiting collection');
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="Packages" title="Package notifications" />
      <Panel title="Collection rules">
        <DetailRows rows={[
          ['Collection location', buildingConfig.packageManagement.collectionLocation ?? 'Not configured'],
          ['Collection hours', buildingConfig.packageManagement.collectionHours ?? 'Not configured'],
          ['ID required', buildingConfig.packageManagement.idRequired ? 'Yes' : 'No'],
          ['Notifications', buildingConfig.packageManagement.notificationRules ?? 'In-app']
        ]} />
      </Panel>
      <Panel title="Awaiting collection">
        <RecordTable records={records} />
      </Panel>
    </div>
  );
}

function CompliancePage({ role, buildingConfig }: { role: Role; buildingConfig: BuildingConfiguration }) {
  const requirements = buildingConfig.compliance.filter((item) => item.enabled);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Compliance" title={`${buildingConfig.profile.name} compliance requirements`} action={<span className="pill bg-blue-50 text-blue-700 ring-blue-200">Configured per building</span>} />
      <Panel title="Active requirements">
        <RecordTable records={requirements.map((item) => ({
          id: item.id,
          title: item.category,
          buildingId: buildingConfig.buildingId,
          owner: item.responsible,
          status: 'Open',
          meta: `${item.frequency} schedule`
        }))} />
      </Panel>
      {(role === 'manager' || role === 'portfolio_admin') && (
        <Panel title="Linked assets">
          <RecordTable records={buildingConfig.assets.map(assetToRecord)} />
        </Panel>
      )}
    </div>
  );
}

type SettingFormKind = 'facility' | 'contact' | 'issueCategory' | 'packageManagement' | 'renovationRule';

type ActiveSettingForm = {
  kind: SettingFormKind;
  id?: string;
};

function BuildingSettingsPage({ buildingConfig, actions }: { buildingConfig: BuildingConfiguration; actions: FlowActions }) {
  const tabs = ['Profile', 'Facilities', 'Contacts / Directory', 'Issue Categories', 'Renovation Rules', 'Package Management', 'Compliance Items', 'Assets', 'Resident Permissions', 'Notification Rules'] as const;
  const [activeTab, setActiveTab] = useState<typeof tabs[number]>('Profile');
  const [activeSettingForm, setActiveSettingForm] = useState<ActiveSettingForm | null>(null);

  async function saveConfig(nextConfig: BuildingConfiguration, action: string) {
    await actions.saveBuildingConfig(nextConfig, action);
    setActiveSettingForm(null);
  }

  function updateFacilities(id: string, patch: Partial<BuildingConfiguration['facilities'][number]>, action: string) {
    const nextConfig = {
      ...buildingConfig,
      facilities: buildingConfig.facilities.map((facility) => facility.id === id ? { ...facility, ...patch } : facility)
    };
    void saveConfig(nextConfig, action);
  }

  function updateContacts(id: string, patch: Partial<BuildingContact>, action: string) {
    const nextConfig = {
      ...buildingConfig,
      contacts: buildingConfig.contacts.map((contact) => contact.id === id ? { ...contact, ...patch } : contact)
    };
    void saveConfig(nextConfig, action);
  }

  function updateIssueCategory(id: string, patch: Partial<BuildingConfiguration['issueCategories'][number]>, action: string) {
    const nextConfig = {
      ...buildingConfig,
      issueCategories: buildingConfig.issueCategories.map((category) => category.id === id ? { ...category, ...patch } : category)
    };
    void saveConfig(nextConfig, action);
  }

  function updateRenovationRule(id: string, patch: Partial<BuildingConfiguration['renovationRules'][number]>, action: string) {
    const nextConfig = {
      ...buildingConfig,
      renovationRules: buildingConfig.renovationRules.map((rule) => rule.id === id ? { ...rule, ...patch } : rule)
    };
    void saveConfig(nextConfig, action);
  }

  async function submitSettingForm(kind: SettingFormKind, values: Record<string, string>, id?: string) {
    if (kind === 'facility') {
      const facility = {
        id: id ?? createConfigId(buildingConfig.buildingId, 'facility'),
        name: values.name,
        description: values.description,
        location: values.location,
        availability: values.availability,
        maxBookingLength: values.maxBookingLength,
        advanceNotice: values.advanceNotice,
        approvalRequired: values.approvalRequired === 'Yes',
        feePlaceholder: values.feePlaceholder,
        capacity: Number(values.capacity) || 1,
        rules: values.rules,
        visibility: values.visibility as BuildingConfiguration['facilities'][number]['visibility'],
        status: values.status as BuildingConfiguration['facilities'][number]['status']
      };
      const nextFacilities = id ? buildingConfig.facilities.map((item) => item.id === id ? facility : item) : [facility, ...buildingConfig.facilities];
      await saveConfig({ ...buildingConfig, facilities: nextFacilities }, id ? 'UPDATE_BUILDING_FACILITY' : 'ADD_BUILDING_FACILITY');
    }

    if (kind === 'contact') {
      const contact: BuildingContact = {
        id: id ?? createConfigId(buildingConfig.buildingId, 'contact'),
        type: values.type,
        name: values.name,
        detail: values.detail,
        visibility: values.visibility as BuildingContact['visibility'],
        status: values.status as BuildingContact['status']
      };
      const nextContacts = id ? buildingConfig.contacts.map((item) => item.id === id ? contact : item) : [contact, ...buildingConfig.contacts];
      await saveConfig({ ...buildingConfig, contacts: nextContacts }, id ? 'UPDATE_BUILDING_CONTACT' : 'ADD_BUILDING_CONTACT');
    }

    if (kind === 'issueCategory') {
      const issueCategory = {
        id: id ?? createConfigId(buildingConfig.buildingId, 'issue'),
        label: values.label,
        enabled: values.enabled === 'Yes',
        defaultPriority: values.defaultPriority as Priority,
        defaultContractorId: values.defaultContractorId || undefined
      };
      const nextCategories = id ? buildingConfig.issueCategories.map((item) => item.id === id ? issueCategory : item) : [issueCategory, ...buildingConfig.issueCategories];
      await saveConfig({ ...buildingConfig, issueCategories: nextCategories }, id ? 'UPDATE_ISSUE_CATEGORY' : 'ADD_ISSUE_CATEGORY');
    }

    if (kind === 'packageManagement') {
      await saveConfig({
        ...buildingConfig,
        packageManagement: {
          enabled: values.enabled === 'Yes',
          collectionLocation: values.collectionLocation,
          collectionHours: values.collectionHours,
          idRequired: values.idRequired === 'Yes',
          notificationRules: values.notificationRules
        }
      }, 'UPDATE_PACKAGE_MANAGEMENT');
    }

    if (kind === 'renovationRule') {
      const rule = {
        id: id ?? createConfigId(buildingConfig.buildingId, 'renovation'),
        type: values.type,
        enabled: values.enabled === 'Yes',
        requiredDocuments: splitCsv(values.requiredDocuments),
        acknowledgements: splitCsv(values.acknowledgements),
        approvalPathway: values.approvalPathway,
        committeeReviewRequired: values.committeeReviewRequired === 'Yes',
        noiseRules: values.noiseRules
      };
      const nextRules = id ? buildingConfig.renovationRules.map((item) => item.id === id ? rule : item) : [rule, ...buildingConfig.renovationRules];
      await saveConfig({ ...buildingConfig, renovationRules: nextRules }, id ? 'UPDATE_RENOVATION_TYPE' : 'ADD_RENOVATION_TYPE');
    }
  }

  const recordsByTab: Record<typeof activeTab, SimpleRecord[]> = {
    Profile: [{
      id: `${buildingConfig.buildingId}-profile`,
      title: buildingConfig.profile.name,
      buildingId: buildingConfig.buildingId,
      owner: buildingConfig.profile.buildingType,
      status: 'Configured',
      meta: buildingConfig.profile.notes
    }],
    Facilities: buildingConfig.facilities.map((facility) => ({
      id: facility.id,
      title: facility.name,
      buildingId: buildingConfig.buildingId,
      owner: facility.location,
      status: facility.status,
      meta: `${facility.availability} · ${facility.maxBookingLength} · ${facility.visibility}`
    })),
    'Contacts / Directory': buildingConfig.contacts.map((contact) => contactToRecord(contact, buildingConfig.buildingId)),
    'Issue Categories': buildingConfig.issueCategories.map((category) => ({
      id: category.id,
      title: category.label,
      buildingId: buildingConfig.buildingId,
      owner: category.defaultContractorId ?? 'No default contractor',
      status: category.enabled ? 'Enabled' : 'Disabled',
      priority: category.defaultPriority,
      meta: `Default priority: ${category.defaultPriority}`
    })),
    'Renovation Rules': buildingConfig.renovationRules.map((rule) => ({
      id: rule.id,
      title: rule.type,
      buildingId: buildingConfig.buildingId,
      owner: rule.committeeReviewRequired ? 'Committee review' : 'Manager review',
      status: rule.enabled ? 'Enabled' : 'Disabled',
      meta: `${rule.approvalPathway} · ${rule.requiredDocuments.join(', ')}`
    })),
    'Package Management': [{
      id: `${buildingConfig.buildingId}-packages`,
      title: buildingConfig.packageManagement.enabled ? 'Package collection enabled' : 'Package collection disabled',
      buildingId: buildingConfig.buildingId,
      owner: buildingConfig.packageManagement.collectionLocation ?? 'No concierge',
      status: buildingConfig.packageManagement.enabled ? 'Enabled' : 'Disabled',
      meta: buildingConfig.packageManagement.enabled ? `${buildingConfig.packageManagement.collectionHours} · ID ${buildingConfig.packageManagement.idRequired ? 'required' : 'not required'}` : 'Residents will not see package collection.'
    }],
    'Compliance Items': buildingConfig.compliance.map((item) => ({
      id: item.id,
      title: item.category,
      buildingId: buildingConfig.buildingId,
      owner: item.responsible,
      status: item.enabled ? 'Enabled' : 'Disabled',
      meta: item.frequency
    })),
    Assets: buildingConfig.assets.map(assetToRecord),
    'Resident Permissions': [
      { id: `${buildingConfig.buildingId}-levies`, title: 'Levy visibility', buildingId: buildingConfig.buildingId, owner: 'Residents', status: buildingConfig.residentPermissions.leviesVisibleTo, meta: 'Controls My Levies navigation.' },
      { id: `${buildingConfig.buildingId}-feed`, title: 'Resident feed posting', buildingId: buildingConfig.buildingId, owner: 'Residents', status: buildingConfig.residentPermissions.residentsCanPostFeed ? 'Enabled' : 'Disabled', meta: 'Controls resident-created feed posts.' },
      { id: `${buildingConfig.buildingId}-facilities`, title: 'Tenant facility bookings', buildingId: buildingConfig.buildingId, owner: 'Tenants', status: buildingConfig.residentPermissions.tenantsCanBookFacilities ? 'Enabled' : 'Disabled', meta: 'Controls tenant booking access.' },
      { id: `${buildingConfig.buildingId}-committee-docs`, title: 'Committee documents', buildingId: buildingConfig.buildingId, owner: 'Committee', status: buildingConfig.residentPermissions.committeeDocumentsVisible ? 'Visible' : 'Restricted', meta: 'Controls committee-only document visibility.' }
    ],
    'Notification Rules': buildingConfig.notificationRules.map((rule, index) => ({
      id: `${buildingConfig.buildingId}-notification-${index}`,
      title: rule,
      buildingId: buildingConfig.buildingId,
      owner: 'Notification rules',
      status: 'Enabled',
      meta: 'In-app and email only for MVP'
    }))
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Building Settings" title={`${buildingConfig.profile.name} configuration`} action={<span className="pill bg-slate-100 text-slate-700 ring-slate-200">Resident experience source of truth</span>} />
      <Panel title="Configuration areas">
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tab) => (
            <button key={tab} className={`tab-button ${activeTab === tab ? 'tab-button-active' : ''}`} onClick={() => setActiveTab(tab)}>
              {tab}
            </button>
          ))}
        </div>
        {activeTab === 'Facilities' ? (
          <EditableSettingsSection
            title="Facilities residents can book"
            addLabel="Add facility"
            onAdd={() => setActiveSettingForm({ kind: 'facility' })}
            records={buildingConfig.facilities.map((facility) => ({
              id: facility.id,
              title: facility.name,
              buildingId: buildingConfig.buildingId,
              owner: facility.location,
              status: facility.status,
              meta: `${facility.availability} · ${facility.visibility} · ${facility.rules}`
            }))}
            renderActions={(record) => {
              const facility = buildingConfig.facilities.find((item) => item.id === record.id);
              if (!facility) return null;
              return (
                <>
                  <button className="btn-secondary" onClick={() => setActiveSettingForm({ kind: 'facility', id: facility.id })}>Edit</button>
                  <button className="btn-secondary" onClick={() => updateFacilities(facility.id, { status: facility.status === 'active' ? 'inactive' : 'active' }, 'TOGGLE_BUILDING_FACILITY')}>
                    {facility.status === 'active' ? 'Deactivate' : 'Activate'}
                  </button>
                </>
              );
            }}
          />
        ) : activeTab === 'Contacts / Directory' ? (
          <EditableSettingsSection
            title="Directory contacts residents can see"
            addLabel="Add contact"
            onAdd={() => setActiveSettingForm({ kind: 'contact' })}
            records={buildingConfig.contacts.map((contact) => contactToRecord(contact, buildingConfig.buildingId))}
            renderActions={(record) => {
              const contact = buildingConfig.contacts.find((item) => item.id === record.id);
              if (!contact) return null;
              return (
                <>
                  <button className="btn-secondary" onClick={() => setActiveSettingForm({ kind: 'contact', id: contact.id })}>Edit</button>
                  <button className="btn-secondary" onClick={() => updateContacts(contact.id, { status: contact.status === 'inactive' ? 'active' : 'inactive' }, 'TOGGLE_BUILDING_CONTACT')}>
                    {contact.status === 'inactive' ? 'Activate' : 'Deactivate'}
                  </button>
                </>
              );
            }}
          />
        ) : activeTab === 'Issue Categories' ? (
          <EditableSettingsSection
            title="Report Issue categories"
            addLabel="Add category"
            onAdd={() => setActiveSettingForm({ kind: 'issueCategory' })}
            records={buildingConfig.issueCategories.map((category) => ({
              id: category.id,
              title: category.label,
              buildingId: buildingConfig.buildingId,
              owner: category.defaultContractorId ?? 'No default contractor',
              status: category.enabled ? 'Enabled' : 'Disabled',
              priority: category.defaultPriority,
              meta: `Default priority: ${category.defaultPriority}`
            }))}
            renderActions={(record) => {
              const category = buildingConfig.issueCategories.find((item) => item.id === record.id);
              if (!category) return null;
              return (
                <>
                  <button className="btn-secondary" onClick={() => setActiveSettingForm({ kind: 'issueCategory', id: category.id })}>Edit</button>
                  <button className="btn-secondary" onClick={() => updateIssueCategory(category.id, { enabled: !category.enabled }, 'TOGGLE_ISSUE_CATEGORY')}>
                    {category.enabled ? 'Deactivate' : 'Activate'}
                  </button>
                </>
              );
            }}
          />
        ) : activeTab === 'Package Management' ? (
          <EditableSettingsSection
            title="Package management"
            addLabel="Edit package settings"
            onAdd={() => setActiveSettingForm({ kind: 'packageManagement' })}
            records={recordsByTab['Package Management']}
            renderActions={() => (
              <>
                <button className="btn-secondary" onClick={() => setActiveSettingForm({ kind: 'packageManagement' })}>Edit</button>
                <button
                  className="btn-secondary"
                  onClick={() => saveConfig({ ...buildingConfig, packageManagement: { ...buildingConfig.packageManagement, enabled: !buildingConfig.packageManagement.enabled } }, 'TOGGLE_PACKAGE_MANAGEMENT')}
                >
                  {buildingConfig.packageManagement.enabled ? 'Disable' : 'Enable'}
                </button>
              </>
            )}
          />
        ) : activeTab === 'Renovation Rules' ? (
          <EditableSettingsSection
            title="Renovation request types"
            addLabel="Add renovation type"
            onAdd={() => setActiveSettingForm({ kind: 'renovationRule' })}
            records={recordsByTab['Renovation Rules']}
            renderActions={(record) => {
              const rule = buildingConfig.renovationRules.find((item) => item.id === record.id);
              if (!rule) return null;
              return (
                <>
                  <button className="btn-secondary" onClick={() => setActiveSettingForm({ kind: 'renovationRule', id: rule.id })}>Edit</button>
                  <button className="btn-secondary" onClick={() => updateRenovationRule(rule.id, { enabled: !rule.enabled }, 'TOGGLE_RENOVATION_TYPE')}>
                    {rule.enabled ? 'Deactivate' : 'Activate'}
                  </button>
                </>
              );
            }}
          />
        ) : (
          <RecordTable records={recordsByTab[activeTab]} />
        )}
      </Panel>
      <SettingsEditModal
        activeForm={activeSettingForm}
        buildingConfig={buildingConfig}
        onClose={() => setActiveSettingForm(null)}
        onSubmit={submitSettingForm}
      />
    </div>
  );
}

function EditableSettingsSection({
  title,
  addLabel,
  records,
  onAdd,
  renderActions
}: {
  title: string;
  addLabel: string;
  records: SimpleRecord[];
  onAdd: () => void;
  renderActions: (record: SimpleRecord) => ReactNode;
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-slate-500">Changes save to Supabase and drive resident workflows for this building.</p>
        <button className="btn-primary" onClick={onAdd}><Plus size={17} /> {addLabel}</button>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {records.map((record) => (
          <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={record.id}>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <h3 className="font-semibold">{record.title}</h3>
                <p className="mt-1 text-sm text-slate-500">{record.owner}</p>
              </div>
              <Badge label={record.status} tone={record.priority} />
            </div>
            <p className="mt-3 text-sm leading-6 text-slate-600">{record.meta}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {renderActions(record)}
            </div>
          </article>
        ))}
      </div>
      {!records.length && <EmptyState title={`No ${title.toLowerCase()} configured`} copy="Add the first record to make it available to residents for this building." />}
    </div>
  );
}

function SettingsEditModal({
  activeForm,
  buildingConfig,
  onClose,
  onSubmit
}: {
  activeForm: ActiveSettingForm | null;
  buildingConfig: BuildingConfiguration;
  onClose: () => void;
  onSubmit: (kind: SettingFormKind, values: Record<string, string>, id?: string) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});

  useEffect(() => {
    setValues({});
  }, [activeForm?.kind, activeForm?.id]);

  if (!activeForm) return null;

  const currentForm = activeForm;
  const config = settingsFormConfig(activeForm, buildingConfig);
  const formValues = { ...config.defaults, ...values };

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit(currentForm.kind, formValues, currentForm.id);
    setValues({});
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <form className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbour">Building Settings</p>
            <h2 className="mt-2 text-2xl font-semibold">{config.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{config.copy}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close settings form">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {config.fields.map((field) => (
            <label className={field.type === 'textarea' ? 'sm:col-span-2' : ''} key={field.name}>
              <span className="text-sm font-medium text-slate-600">{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" value={formValues[field.name] ?? ''} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required} />
              ) : field.options ? (
                <select className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" value={formValues[field.name] ?? field.options[0]} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required}>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" value={formValues[field.name] ?? ''} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required} />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">Save settings</button>
        </div>
      </form>
    </div>
  );
}

function settingsFormConfig(activeForm: ActiveSettingForm, buildingConfig: BuildingConfiguration): { title: string; copy: string; defaults: Record<string, string>; fields: FormField[] } {
  if (activeForm.kind === 'facility') {
    const facility = buildingConfig.facilities.find((item) => item.id === activeForm.id);
    return {
      title: facility ? 'Edit facility' : 'Add facility',
      copy: 'Active facilities appear instantly in resident Facility Bookings for this building.',
      defaults: {
        name: facility?.name ?? '',
        description: facility?.description ?? '',
        location: facility?.location ?? '',
        availability: facility?.availability ?? 'Mon-Fri 9am-5pm',
        maxBookingLength: facility?.maxBookingLength ?? '2 hours',
        advanceNotice: facility?.advanceNotice ?? '24 hours',
        approvalRequired: facility?.approvalRequired ? 'Yes' : 'No',
        feePlaceholder: facility?.feePlaceholder ?? 'No fee',
        capacity: String(facility?.capacity ?? 1),
        rules: facility?.rules ?? '',
        visibility: facility?.visibility ?? 'all residents',
        status: facility?.status ?? 'active'
      },
      fields: [
        { name: 'name', label: 'Facility name', required: true },
        { name: 'location', label: 'Location', required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true },
        { name: 'availability', label: 'Availability days/times', required: true },
        { name: 'maxBookingLength', label: 'Max booking length', required: true },
        { name: 'advanceNotice', label: 'Advance notice required', required: true },
        { name: 'approvalRequired', label: 'Approval required', options: ['Yes', 'No'], required: true },
        { name: 'feePlaceholder', label: 'Deposit/fee placeholder' },
        { name: 'capacity', label: 'Capacity', required: true },
        { name: 'visibility', label: 'Visibility', options: ['all residents', 'owners only', 'tenants allowed', 'committee only'], required: true },
        { name: 'status', label: 'Status', options: ['active', 'inactive'], required: true },
        { name: 'rules', label: 'Booking rules/instructions', type: 'textarea', required: true }
      ]
    };
  }

  if (activeForm.kind === 'contact') {
    const contact = buildingConfig.contacts.find((item) => item.id === activeForm.id);
    return {
      title: contact ? 'Edit directory contact' : 'Add directory contact',
      copy: 'Active visible contacts appear instantly in the resident Building Directory.',
      defaults: {
        type: contact?.type ?? 'Building manager',
        name: contact?.name ?? '',
        detail: contact?.detail ?? '',
        visibility: contact?.visibility ?? 'all residents',
        status: contact?.status ?? 'active'
      },
      fields: [
        { name: 'type', label: 'Contact type', required: true },
        { name: 'name', label: 'Name', required: true },
        { name: 'detail', label: 'Phone, email, or instructions', required: true },
        { name: 'visibility', label: 'Visibility', options: ['all residents', 'committee only', 'managers only'], required: true },
        { name: 'status', label: 'Status', options: ['active', 'inactive'], required: true }
      ]
    };
  }

  if (activeForm.kind === 'issueCategory') {
    const category = buildingConfig.issueCategories.find((item) => item.id === activeForm.id);
    return {
      title: category ? 'Edit issue category' : 'Add issue category',
      copy: 'Enabled categories appear instantly in the resident Report Issue flow.',
      defaults: {
        label: category?.label ?? '',
        enabled: category?.enabled === false ? 'No' : 'Yes',
        defaultPriority: category?.defaultPriority ?? 'Medium',
        defaultContractorId: category?.defaultContractorId ?? ''
      },
      fields: [
        { name: 'label', label: 'Category label', required: true },
        { name: 'enabled', label: 'Enabled', options: ['Yes', 'No'], required: true },
        { name: 'defaultPriority', label: 'Default priority', options: ['Low', 'Medium', 'High', 'Emergency'], required: true },
        { name: 'defaultContractorId', label: 'Default contractor placeholder' }
      ]
    };
  }

  if (activeForm.kind === 'packageManagement') {
    const settings = buildingConfig.packageManagement;
    return {
      title: 'Edit package management',
      copy: 'When disabled, package navigation and dashboard widgets are hidden for residents in this building.',
      defaults: {
        enabled: settings.enabled ? 'Yes' : 'No',
        collectionLocation: settings.collectionLocation ?? '',
        collectionHours: settings.collectionHours ?? '',
        idRequired: settings.idRequired ? 'Yes' : 'No',
        notificationRules: settings.notificationRules ?? ''
      },
      fields: [
        { name: 'enabled', label: 'Package management enabled', options: ['Yes', 'No'], required: true },
        { name: 'collectionLocation', label: 'Collection location' },
        { name: 'collectionHours', label: 'Collection instructions/hours' },
        { name: 'idRequired', label: 'ID required', options: ['Yes', 'No'], required: true },
        { name: 'notificationRules', label: 'Resident instructions', type: 'textarea' }
      ]
    };
  }

  const rule = buildingConfig.renovationRules.find((item) => item.id === activeForm.id);
  return {
    title: rule ? 'Edit renovation type' : 'Add renovation type',
    copy: 'Enabled request types appear instantly in the resident Renovation Request form.',
    defaults: {
      type: rule?.type ?? '',
      enabled: rule?.enabled === false ? 'No' : 'Yes',
      requiredDocuments: rule?.requiredDocuments.join(', ') ?? '',
      acknowledgements: rule?.acknowledgements.join(', ') ?? 'By-law acknowledgement',
      approvalPathway: rule?.approvalPathway ?? 'Manager review',
      committeeReviewRequired: rule?.committeeReviewRequired ? 'Yes' : 'No',
      noiseRules: rule?.noiseRules ?? ''
    },
    fields: [
      { name: 'type', label: 'Renovation type', required: true },
      { name: 'enabled', label: 'Enabled', options: ['Yes', 'No'], required: true },
      { name: 'requiredDocuments', label: 'Required documents/checklist', type: 'textarea', required: true },
      { name: 'acknowledgements', label: 'Required acknowledgements', type: 'textarea' },
      { name: 'approvalPathway', label: 'Approval pathway', required: true },
      { name: 'committeeReviewRequired', label: 'Committee review required', options: ['Yes', 'No'], required: true },
      { name: 'noiseRules', label: 'Noise rules', type: 'textarea' }
    ]
  };
}

function IncidentsPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const records = filterForRole(data.incidents, role);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Incident Register" title="Insurance, WHS and complaints" action={<ComingSoonButton primary icon={<Plus size={17} />} label="Record incident" />} />
      <div className="grid gap-4 lg:grid-cols-2">
        {records.map((incident) => (
          <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={incident.id}>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <Badge label={incident.status} tone={incident.priority} />
              <span className="text-xs text-slate-500">{incident.due}</span>
            </div>
            <h3 className="mt-3 font-semibold">{incident.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{buildingName(incident.buildingId)} · {incident.owner}</p>
            <p className="mt-3 text-sm text-slate-600">{incident.meta}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => actions.recordIncidentUpdate(incident.id)}>Add manager note</button>
              <button className="btn-secondary" onClick={() => actions.openForm('updateJobStatus', { id: 'mr-demo-contractor', status: 'Assigned', title: 'Linked work order' })}>Link work order</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function MotionsPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const records = filterForRole(data.motions, role);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Motions & Voting" title="Committee decisions awaiting action" />
      <div className="grid gap-4 lg:grid-cols-2">
        {records.map((motion) => (
          <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={motion.id}>
            <Badge label={motion.status} />
            <h3 className="mt-3 font-semibold">{motion.title}</h3>
            <p className="mt-1 text-sm text-slate-500">{buildingName(motion.buildingId)} · {motion.meta}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => actions.openForm('voteMotion', { id: motion.id, title: motion.title })}>Vote</button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function QuotesPage({ role }: { role: Role }) {
  return <ModulePage title="Quotes" eyebrow="Committee-visible contractor quotes" records={filterForRole(quoteRecords(), role)} cta="Request quote" />;
}

function MeetingsPage({ role }: { role: Role }) {
  return <ModulePage title="Meetings" eyebrow="Committee meetings, agendas and records" records={filterForRole(meetings, role)} cta="Create meeting" />;
}

function PerformancePage({ title, eyebrow, records }: { title: string; eyebrow: string; records: SimpleRecord[] }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow={eyebrow} title={title} />
      <Panel title="Portfolio signals">
        <RecordTable records={records} />
      </Panel>
    </div>
  );
}

function ReportsPage({ role, data }: { role: Role; data: MvpData }) {
  const recordsByRole: Record<Role, SimpleRecord[]> = {
    super_admin: [
      { id: 'usage-1', title: 'Northshore Strata Co. usage', buildingId: 'b1', owner: 'Platform', status: 'Active', due: '2026-06-06', meta: `${company.usage}% workspace usage` },
      { id: 'usage-2', title: 'Feature adoption', buildingId: 'b1', owner: 'Platform', status: 'Open', due: '2026-06-12', meta: 'Communications, documents, maintenance' }
    ],
    portfolio_admin: [
      ...levySummaryByBuilding().map(summaryToRecord),
      ...contractorPerformanceRecords().slice(0, 3)
    ],
    manager: [
      ...filterForRole(data.maintenanceRequests, 'manager').slice(0, 4).map(maintenanceToRecord),
      ...filterForRole(complianceItems, 'manager').filter((item) => item.status !== 'Open')
    ],
    resident: [],
    committee: [],
    contractor: []
  };
  return <ModulePage title="Reports" eyebrow={rolePermissions[role].scope} records={recordsByRole[role]} cta="Export report" />;
}

function NoticeCard({ notice, role }: { notice: Notice; role: Role }) {
  return (
    <article className="rounded-3xl border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge label={notice.priority} tone={notice.priority} />
          {notice.publicationStatus === 'Draft' && <Badge label="Draft" />}
        </div>
        <span className="text-xs text-slate-500">
          {notice.publicationStatus === 'Draft'
            ? 'Not visible to residents'
            : (role === 'manager' || role === 'portfolio_admin' || role === 'super_admin')
              ? `${notice.reads} read receipt${notice.reads === 1 ? '' : 's'}`
              : formatDate(notice.publishAt)}
        </span>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{notice.title}</h2>
      <p className="mt-2 text-sm text-slate-500">{buildingName(notice.buildingId)} · {notice.audience}</p>
      <p className="mt-4 text-sm leading-6 text-slate-600">{notice.body}</p>
    </article>
  );
}

function WorkflowModal({
  activeForm,
  role,
  data,
  buildingConfig,
  onClose,
  onSubmit
}: {
  activeForm: ActiveForm | null;
  role: Role;
  data: MvpData;
  buildingConfig: BuildingConfiguration;
  onClose: () => void;
  onSubmit: (payload: Record<string, string | File>, context?: FormContext) => Promise<void>;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [files, setFiles] = useState<Record<string, File>>({});

  if (!activeForm) return null;

  const currentForm = activeForm;
  const config = formConfig(activeForm.kind, role, activeForm.context, data, buildingConfig);
  const formValues = { ...config.defaults, ...values };

  function updateValue(name: string, value: string) {
    setValues((current) => ({ ...current, [name]: value }));
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await onSubmit({ ...formValues, ...files }, currentForm.context);
    setValues({});
    setFiles({});
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-950/45 px-4 py-6">
      <form className="max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-3xl border border-line bg-white p-6 shadow-2xl" onSubmit={submit}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-sm font-semibold uppercase tracking-wide text-harbour">Atlas workflow</p>
            <h2 className="mt-2 text-2xl font-semibold">{config.title}</h2>
            <p className="mt-2 text-sm text-slate-500">{config.copy}</p>
          </div>
          <button type="button" className="icon-button" onClick={onClose} aria-label="Close form">
            <X size={18} />
          </button>
        </div>
        <div className="mt-6 grid gap-4">
          {config.fields.map((field) => (
            <label key={field.name}>
              <span className="text-sm font-medium text-slate-600">{field.label}</span>
              {field.type === 'textarea' ? (
                <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" value={formValues[field.name] ?? ''} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required} />
              ) : field.type === 'file' ? (
                <input className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none file:mr-4 file:rounded-full file:border-0 file:bg-slate-100 file:px-4 file:py-2 file:text-sm file:font-semibold file:text-ink focus:border-harbour" type="file" onChange={(event) => {
                  const nextFile = event.target.files?.[0];
                  setFiles((current) => {
                    const next = { ...current };
                    if (nextFile) next[field.name] = nextFile;
                    else delete next[field.name];
                    return next;
                  });
                }} required={field.required} />
              ) : field.options ? (
                <select className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" value={formValues[field.name] ?? field.options[0]} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required}>
                  {field.options.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              ) : (
                <input className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" value={formValues[field.name] ?? ''} onChange={(event) => updateValue(field.name, event.target.value)} required={field.required} />
              )}
            </label>
          ))}
        </div>
        <div className="mt-6 flex flex-wrap justify-end gap-3">
          <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
          <button type="submit" className="btn-primary">{config.submitLabel}</button>
        </div>
      </form>
    </div>
  );
}

type FormField = {
  name: string;
  label: string;
  type?: 'text' | 'textarea' | 'file';
  required?: boolean;
  options?: string[];
};

function formConfig(kind: FormKind, role: Role, context: FormContext | undefined, data: MvpData, buildingConfig: BuildingConfiguration): { title: string; copy: string; submitLabel: string; defaults: Record<string, string>; fields: FormField[] } {
  const firstJob = data.maintenanceRequests.find((request) => request.id === context?.id);
  const recordTitle = context?.title ?? firstJob?.title ?? 'Selected record';
  const issueOptions = enabledIssueCategories(buildingConfig).map((category) => category.label);
  const facilityOptions = activeFacilities(buildingConfig).map((facility) => facility.name);
  const renovationOptions = activeRenovationRules(buildingConfig).map((rule) => rule.type);
  const buildingOptions = (data.buildings.length ? data.buildings : buildings).map((building) => building.name);
  const configs: Record<FormKind, { title: string; copy: string; submitLabel: string; defaults: Record<string, string>; fields: FormField[] }> = {
    addBuilding: {
      title: 'Add building',
      copy: 'Set up the scheme, manager, resident contacts and core self-service options in one pass.',
      submitLabel: 'Create building',
      defaults: {
        name: '',
        address: '',
        suburb: '',
        state: 'NSW',
        postcode: '',
        lots: '',
        managerEmail: role === 'manager' ? 'manager@northshorestrata.com.au' : 'manager@northshorestrata.com.au',
        contacts: 'Strata manager | Noah Haddad | manager@northshorestrata.com.au',
        facilities: '',
        packageManagement: 'No',
        issueCategories: 'Water leak\nPlumbing\nElectrical\nSecurity\nNoise\nOther',
        starterDocuments: ''
      },
      fields: [
        { name: 'name', label: 'Building name', required: true },
        { name: 'address', label: 'Street address', required: true },
        { name: 'suburb', label: 'Suburb', required: true },
        { name: 'state', label: 'State', options: ['NSW', 'VIC', 'QLD', 'ACT', 'SA', 'WA', 'TAS', 'NT'], required: true },
        { name: 'postcode', label: 'Postcode', required: true },
        { name: 'lots', label: 'Number of lots', required: true },
        { name: 'managerEmail', label: 'Assigned strata manager email', required: true },
        { name: 'contacts', label: 'Contacts, one per line: type | name | detail', type: 'textarea' },
        { name: 'facilities', label: 'Facilities, one per line', type: 'textarea' },
        { name: 'packageManagement', label: 'Package management enabled', options: ['No', 'Yes'], required: true },
        { name: 'issueCategories', label: 'Resident issue categories, one per line', type: 'textarea', required: true },
        { name: 'starterDocuments', label: 'Starter document links, one per line: title | URL', type: 'textarea' }
      ]
    },
    sendMessage: {
      title: role === 'manager' ? 'Reply to resident' : 'Send message',
      copy: 'Creates a visible resident-manager thread record for the other role.',
      submitLabel: 'Send message',
      defaults: { title: role === 'manager' ? 'Manager reply to resident' : 'Question for building manager', body: '' },
      fields: [{ name: 'title', label: 'Subject', required: true }, { name: 'body', label: 'Message', type: 'textarea', required: true }]
    },
    createNotice: {
      title: 'Create notice',
      copy: 'Publish now for residents, or save the notice as a draft for later.',
      submitLabel: 'Save notice',
      defaults: { building: buildingOptions[0] ?? buildingConfig.profile.name, title: 'Lift maintenance update', category: 'Maintenance update', priority: 'Medium', audience: 'All residents', publicationStatus: 'Published', body: '' },
      fields: [
        { name: 'building', label: 'Building', options: buildingOptions, required: true },
        { name: 'title', label: 'Notice title', required: true },
        { name: 'category', label: 'Category', options: ['Announcement', 'Maintenance update', 'Water shutdown', 'Lift outage', 'Emergency alert'], required: true },
        { name: 'priority', label: 'Priority', options: ['Low', 'Medium', 'High', 'Emergency'], required: true },
        { name: 'audience', label: 'Audience', options: ['All residents', 'Owners only', 'Tenants only', 'Committee only'], required: true },
        { name: 'publicationStatus', label: 'Publication', options: ['Published', 'Draft'], required: true },
        { name: 'body', label: 'Notice body', type: 'textarea', required: true }
      ]
    },
    uploadDocument: {
      title: 'Upload document',
      copy: 'Uploads a file to Supabase Storage and creates a document record visible by permission.',
      submitLabel: 'Upload document',
      defaults: { building: buildingOptions[0] ?? buildingConfig.profile.name, title: 'Building update document', category: 'Building documents', visibility: 'All residents', url: '' },
      fields: [
        { name: 'building', label: 'Building', options: buildingOptions, required: true },
        { name: 'file', label: 'File', type: 'file', required: true },
        { name: 'title', label: 'Document title', required: true },
        { name: 'category', label: 'Category', options: ['By-laws', 'Minutes', 'Levy notices', 'Insurance', 'Building documents'], required: true },
        { name: 'visibility', label: 'Visibility', options: ['All residents', 'Committee only'], required: true },
        { name: 'url', label: 'Fallback URL', required: false }
      ]
    },
    reportIssue: {
      title: 'Report issue',
      copy: 'Creates a resident issue and matching maintenance request for manager triage.',
      submitLabel: 'Submit issue',
      defaults: { title: `${issueOptions[0] ?? 'Building'} issue`, category: issueOptions[0] ?? 'Other', severity: enabledIssueCategories(buildingConfig)[0]?.defaultPriority ?? 'Medium', description: '' },
      fields: [
        { name: 'title', label: 'Issue title', required: true },
        { name: 'category', label: 'Category', options: issueOptions.length ? issueOptions : ['Other'], required: true },
        { name: 'severity', label: 'Severity', options: ['Low', 'Medium', 'High', 'Emergency'], required: true },
        { name: 'description', label: 'Description', type: 'textarea', required: true }
      ]
    },
    bookFacility: {
      title: 'Book facility',
      copy: 'Creates a booking request visible in the manager Facilities queue.',
      submitLabel: 'Request booking',
      defaults: { title: facilityOptions[0] ?? 'Facility booking', date: '2026-06-18', notes: '' },
      fields: [
        { name: 'title', label: 'Facility', options: facilityOptions.length ? facilityOptions : ['No active facilities configured'], required: true },
        { name: 'date', label: 'Requested date', required: true },
        { name: 'notes', label: 'Notes', type: 'textarea' }
      ]
    },
    submitRenovation: {
      title: 'Submit renovation request',
      copy: 'Creates a renovation approval request visible to managers.',
      submitLabel: 'Submit request',
      defaults: { title: renovationOptions[0] ?? 'Apartment renovation request', date: '2026-06-21', scope: '' },
      fields: [
        { name: 'title', label: 'Request type', options: renovationOptions.length ? renovationOptions : ['Other'], required: true },
        { name: 'date', label: 'Proposed start date', required: true },
        { name: 'scope', label: 'Scope and contractor details', type: 'textarea', required: true }
      ]
    },
    assignContractor: {
      title: 'Assign contractor',
      copy: `Assigns LiftCare NSW to ${recordTitle} and makes the job visible in the contractor portal.`,
      submitLabel: 'Assign contractor',
      defaults: { contractor: 'LiftCare NSW', note: '' },
      fields: [{ name: 'contractor', label: 'Contractor', options: ['LiftCare NSW'], required: true }, { name: 'note', label: 'Assignment note', type: 'textarea' }]
    },
    updateJobStatus: {
      title: 'Update job status',
      copy: `Updates ${recordTitle} and posts a visible progress message.`,
      submitLabel: 'Save update',
      defaults: { status: context?.status ?? 'In Progress', note: '' },
      fields: [
        { name: 'status', label: 'Status', options: ['Under Review', 'Assigned', 'Scheduled', 'In Progress', 'Completed', 'Closed'], required: true },
        { name: 'note', label: 'Progress note', type: 'textarea', required: true }
      ]
    },
    voteMotion: {
      title: 'Vote on motion',
      copy: `Records your vote on ${recordTitle}.`,
      submitLabel: 'Record vote',
      defaults: { vote: 'Yes', comment: '' },
      fields: [{ name: 'vote', label: 'Vote', options: ['Yes', 'No', 'Abstain'], required: true }, { name: 'comment', label: 'Comment', type: 'textarea' }]
    }
  };
  return configs[kind];
}

function ReportIssueList({ issues, managerView = false, actions }: { issues: ReportIssue[]; managerView?: boolean; actions?: FlowActions }) {
  if (!issues.length) {
    return <EmptyState title="No reported issues" copy={managerView ? 'New resident reports will appear here for triage.' : 'Your submitted issues will appear here.'} />;
  }

  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <article className="rounded-2xl border border-line p-4" key={issue.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge label={issue.severity} tone={issue.severity} />
              {isNewRecord(issue) && <span className="pill bg-blue-50 text-blue-700 ring-blue-200">NEW</span>}
            </div>
            <Badge label={issue.status} />
          </div>
          <h3 className="mt-3 font-semibold">{issue.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{issue.category} · Lot {issue.unit} · {issue.submitted}</p>
          <p className="mt-3 text-sm text-slate-600">{managerView ? `Route to: ${issue.outcome}` : `Progress: ${issue.status} · ${issue.outcome}`}</p>
          {managerView && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => actions?.updateIssueStatus(issue.id, 'Under Review')}>Triage</button>
              <button className="btn-secondary" onClick={() => actions?.openForm('assignContractor', { id: issue.id, title: issue.title })}>Assign contractor</button>
              <button className="btn-secondary" onClick={() => actions?.notifyResident(issue.id)}>Notify resident</button>
            </div>
          )}
        </article>
      ))}
    </div>
  );
}

function ActionList({ actions }: { actions: [string, (() => void) | 'deferred'][] }) {
  return (
    <div className="grid gap-3">
      {actions.map(([label, action]) => (
        <button className="flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-left hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-55" key={label} onClick={action === 'deferred' ? undefined : action} disabled={action === 'deferred'} title={action === 'deferred' ? 'Coming Soon' : undefined}>
          <span className="font-medium">{label}</span>
          <ArrowRight size={17} />
        </button>
      ))}
    </div>
  );
}

function ComingSoonButton({ label, icon, primary = false }: { label: string; icon?: ReactNode; primary?: boolean }) {
  return (
    <button className={primary ? 'btn-primary' : 'btn-secondary'} disabled title="Coming Soon">
      {icon}
      {label} · Coming Soon
    </button>
  );
}

function DirectoryPanel({ buildingConfig, role, className = '' }: { buildingConfig: BuildingConfiguration; role: Role; className?: string }) {
  const contacts = visibleContacts(buildingConfig, role);
  return (
    <Panel title={`${buildingConfig.profile.name} contacts`} className={className}>
      {contacts.length ? (
        <DetailRows rows={contacts.map((contact) => [contact.type, `${contact.name} · ${contact.detail}`])} />
      ) : (
        <EmptyState title="No contacts configured" copy="Contacts are managed per building by the strata manager." />
      )}
    </Panel>
  );
}

function WorkOrdersPage({ role }: { role: Role }) {
  return <ModulePage title="Work Orders" eyebrow="Assign contractors, approve quotes, track progress and close jobs" records={[]} cta="Create work order" />;
}

function ProjectsPage({ role }: { role: Role }) {
  const scoped = filterForRole(projects, role);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Major projects" title="Capital works and resident updates" action={<ComingSoonButton primary icon={<Plus size={17} />} label="New project" />} />
      <div className="grid gap-4 lg:grid-cols-2">
        {scoped.map((project) => (
          <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={project.id}>
            <div className="flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">{project.title}</h2>
                <p className="mt-1 text-sm text-slate-500">{buildingName(project.buildingId)} · {contractors.find((contractor) => contractor.id === project.contractorId)?.company}</p>
              </div>
              <Badge label={project.status} />
            </div>
            <div className="mt-5">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span className="font-semibold">{project.progress}%</span>
              </div>
              <div className="mt-2 h-2 rounded-full bg-slate-100">
                <div className="h-full rounded-full bg-harbour" style={{ width: `${project.progress}%` }} />
              </div>
            </div>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <MiniStat label="Budget" value={currency(project.budget)} />
              <MiniStat label="Spend" value={currency(project.spend)} />
              <MiniStat label="Risk" value={project.risk} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function ModulePage({ title, eyebrow, records, cta, compact = false }: { title: string; eyebrow: string; records: SimpleRecord[]; cta: string; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {!compact && <SectionHeader eyebrow={eyebrow} title={title} action={<ComingSoonButton primary icon={<Plus size={17} />} label={cta} />} />}
      <Panel title={compact ? title : 'Records'} action={!compact ? <ComingSoonButton icon={<Download size={16} />} label="Export" /> : undefined}>
        {records.length ? <RecordTable records={records} /> : <EmptyState title="Nothing needs attention" copy="New activity will appear here once residents, managers or contractors create records." />}
      </Panel>
      {!compact && title === 'Levy Tracking' && <p className="text-xs text-slate-500">Accounting, payment and bank reconciliation integrations are Coming Soon.</p>}
    </div>
  );
}

function MaintenanceCards({ requests, contractorView = false, compact = false, onAssignContractor, onContractorUpdate, onStatusUpdate }: { requests: MaintenanceRequest[]; contractorView?: boolean; compact?: boolean; onAssignContractor?: (id?: string) => void; onContractorUpdate?: (id?: string, status?: string) => void; onStatusUpdate?: (id: string, status: string) => void }) {
  if (!requests.length) {
    return <EmptyState title="No maintenance requests" copy="New resident issues and assigned jobs will appear here." />;
  }

  return (
    <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-2'}`}>
      {requests.map((request) => (
        <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={request.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap gap-2">
              <Badge label={request.priority} tone={request.priority} />
              {isNewRecord(request) && <span className="pill bg-blue-50 text-blue-700 ring-blue-200">NEW</span>}
            </div>
            <Badge label={request.overdue ? 'Overdue' : request.status} />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{request.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{buildingName(request.buildingId)} · Lot {request.unit} · {request.category}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniStat label={contractorView ? 'Contact' : 'Resident'} value={request.resident} />
            <MiniStat label="SLA" value={`${request.slaHours}h`} />
            <MiniStat label="Access" value={request.access.includes('Permission') ? 'Permitted' : 'By appointment'} />
          </div>
          {request.timeline?.length ? (
            <div className="mt-5 rounded-2xl bg-slate-50 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Timeline</p>
              <div className="mt-3 space-y-2">
                {request.timeline.map((item) => (
                  <p className="text-sm text-slate-600" key={item}>{item}</p>
                ))}
              </div>
            </div>
          ) : null}
          {(onStatusUpdate || onAssignContractor || onContractorUpdate) && (
            <div className="mt-5 flex flex-wrap gap-2">
            {contractorView && onContractorUpdate ? (
              <>
                <button className="btn-secondary" onClick={() => onContractorUpdate(request.id, request.status)}><MessageSquare size={16} /> Add update</button>
                {!['In Progress', 'Completed', 'Closed'].includes(request.status) && <button className="btn-secondary" onClick={() => onContractorUpdate(request.id, 'In Progress')}>Mark in progress</button>}
                {!['Completed', 'Closed'].includes(request.status) && <button className="btn-secondary" onClick={() => onContractorUpdate(request.id, 'Completed')}>Mark completed</button>}
              </>
            ) : (
              <>
                {onStatusUpdate && ['Submitted', 'Triage'].includes(request.status) && <button className="btn-secondary" onClick={() => onStatusUpdate(request.id, 'Under Review')}>Start review</button>}
                {onAssignContractor && !request.contractorId && !['Completed', 'Closed'].includes(request.status) && <button className="btn-secondary" onClick={() => onAssignContractor(request.id)}>Assign contractor</button>}
                {onStatusUpdate && request.contractorId && !['Scheduled', 'In Progress', 'Completed', 'Closed'].includes(request.status) && <button className="btn-secondary" onClick={() => onStatusUpdate(request.id, 'Scheduled')}>Schedule</button>}
                {onStatusUpdate && request.status === 'Completed' && <button className="btn-secondary" onClick={() => onStatusUpdate(request.id, 'Closed')}>Review and close</button>}
              </>
            )}
          </div>
          )}
        </article>
      ))}
    </div>
  );
}

function RecordTable({ records }: { records: SimpleRecord[] }) {
  return (
    <div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wide text-slate-500">
              <th className="py-3 pr-4 font-semibold">Item</th>
              <th className="py-3 pr-4 font-semibold">Building</th>
              <th className="py-3 pr-4 font-semibold">Owner</th>
              <th className="py-3 pr-4 font-semibold">Status</th>
              <th className="py-3 pr-4 font-semibold">Due</th>
              <th className="py-3 pr-4 font-semibold">Context</th>
            </tr>
          </thead>
          <tbody>
            {records.map((record) => (
              <tr className="border-b border-line last:border-0" key={record.id}>
                <td className="py-4 pr-4 font-medium">
                  <div className="flex flex-wrap items-center gap-2">
                    <span>{record.title}</span>
                    {isNewRecord(record) && <span className="pill bg-blue-50 text-blue-700 ring-blue-200">NEW</span>}
                  </div>
                </td>
                <td className="py-4 pr-4 text-slate-600">{buildingName(record.buildingId)}</td>
                <td className="py-4 pr-4 text-slate-600">{record.owner}</td>
                <td className="py-4 pr-4"><Badge label={record.status} tone={record.priority} /></td>
                <td className="py-4 pr-4 text-slate-600">{record.due ?? 'Not set'}</td>
                <td className="py-4 pr-4 text-slate-600">
                  {record.href ? <a className="font-semibold text-harbour hover:underline" href={record.href} target="_blank" rel="noreferrer">View document</a> : record.amount ? currency(record.amount) : record.meta}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <p className="text-sm font-semibold uppercase tracking-wide text-harbour">{eyebrow}</p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink sm:text-4xl">{title}</h1>
      </div>
      {action}
    </div>
  );
}

function Panel({ title, action, children, className = '' }: { title: string; action?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <section className={`rounded-3xl border border-line bg-white p-5 shadow-soft ${className}`}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function Metric({ title, value, detail, icon: Icon, tone = 'navy' }: { title: string; value: string; detail: string; icon: ElementType; tone?: 'navy' | 'amber' | 'green' | 'red' | 'blue' }) {
  const toneClass = {
    navy: 'bg-navy text-white',
    amber: 'bg-amber-50 text-amber-800',
    green: 'bg-emerald-50 text-emerald-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-blue-50 text-blue-700'
  }[tone];
  return (
    <article className="rounded-3xl border border-line bg-white p-5 shadow-soft">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${toneClass}`}>
        <Icon size={20} />
      </div>
      <p className="mt-5 text-sm text-slate-500">{title}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight">{value}</p>
      <p className="mt-1 text-sm text-slate-500">{detail}</p>
    </article>
  );
}

function Badge({ label, tone }: { label: string; tone?: Priority }) {
  const classes = tone ? priorityClasses[tone] : statusClasses[label] ?? 'bg-slate-100 text-slate-700 ring-slate-200';
  return <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${classes}`}>{label}</span>;
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-slate-50 p-3">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function Score({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="flex justify-between text-sm">
        <span className="font-medium">{label}</span>
        <span className="text-slate-500">{value}%</span>
      </div>
      <div className="mt-2 h-2 rounded-full bg-slate-100">
        <div className="h-full rounded-full bg-harbour" style={{ width: `${value}%` }} />
      </div>
    </div>
  );
}

function EmptyState({ title, copy }: { title: string; copy: string }) {
  return (
    <div className="grid min-h-64 place-items-center rounded-3xl border border-dashed border-line bg-slate-50 p-8 text-center">
      <div>
        <Sparkles className="mx-auto text-harbour" />
        <h3 className="mt-4 text-lg font-semibold">{title}</h3>
        <p className="mt-2 max-w-md text-sm text-slate-500">{copy}</p>
      </div>
    </div>
  );
}

function DetailRows({ rows }: { rows: [string, string][] }) {
  return (
    <div className="divide-y divide-line">
      {rows.map(([label, value]) => (
        <div className="grid gap-2 py-3 sm:grid-cols-[150px_1fr]" key={label}>
          <span className="text-sm text-slate-500">{label}</span>
          <span className="text-sm font-medium">{value}</span>
        </div>
      ))}
    </div>
  );
}

function resolveBuildingConfig(data: MvpData, buildingId: string) {
  return data.buildingConfigurations.find((config) => config.buildingId === buildingId) ?? getBuildingConfig(buildingId);
}

function activeFacilities(config: BuildingConfiguration) {
  return config.facilities.filter((facility) => facility.status === 'active');
}

function enabledIssueCategories(config: BuildingConfiguration) {
  return config.issueCategories.filter((category) => category.enabled);
}

function activeRenovationRules(config: BuildingConfiguration) {
  return config.renovationRules.filter((rule) => rule.enabled);
}

function visibleContacts(config: BuildingConfiguration, role: Role) {
  return config.contacts.filter((contact) => {
    if (contact.status === 'inactive') return false;
    if (role === 'manager' || role === 'portfolio_admin' || role === 'super_admin') return true;
    if (role === 'committee') return contact.visibility !== 'managers only';
    return contact.visibility === 'all residents';
  });
}

function contactToRecord(contact: BuildingContact, buildingId: string): SimpleRecord {
  return {
    id: contact.id,
    title: contact.type,
    buildingId,
    owner: contact.name,
    status: contact.status === 'inactive' ? 'inactive' : 'active',
    meta: contact.detail
  };
}

function createConfigId(buildingId: string, prefix: string) {
  const random = typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID().slice(0, 8) : Date.now().toString(36);
  return `${buildingId}-${prefix}-${random}`;
}

function splitCsv(value: string) {
  return value.split(',').map((item) => item.trim()).filter(Boolean);
}

function assetToRecord(asset: BuildingConfiguration['assets'][number]): SimpleRecord {
  return {
    id: asset.id,
    title: asset.name,
    buildingId: asset.id.split('-')[0],
    owner: asset.contractorId ?? 'Internal',
    status: 'Open',
    meta: `${asset.type} · ${asset.location} · ${asset.serviceFrequency}`
  };
}

function noticeToRecord(notice: Notice): SimpleRecord {
  return {
    id: notice.id,
    title: notice.title,
    buildingId: notice.buildingId,
    owner: notice.audience,
    status: notice.category,
    priority: notice.priority,
    due: notice.publishAt,
    meta: notice.channels.join(', ')
  };
}

function maintenanceToRecord(request: MaintenanceRequest): SimpleRecord {
  return {
    id: request.id,
    title: request.title,
    buildingId: request.buildingId,
    owner: request.resident,
    status: request.overdue ? 'Overdue' : request.status,
    priority: request.priority,
    due: request.submitted,
    meta: `SLA ${request.slaHours}h · ${request.access}`
  };
}

function projectToRecord(project: Project): SimpleRecord {
  return {
    id: project.id,
    title: project.title,
    buildingId: project.buildingId,
    owner: contractors.find((contractor) => contractor.id === project.contractorId)?.company ?? 'Unassigned',
    status: project.status,
    due: project.nextMilestone,
    amount: project.budget,
    meta: `${project.progress}%`
  };
}

function staffPerformanceRecords(): SimpleRecord[] {
  return staff.map((person, index) => ({
    id: `staff-${person.id}`,
    title: person.name,
    buildingId: person.buildingId,
    owner: person.email,
    status: index === 1 ? 'High workload' : 'On track',
    due: `${filterForRole(maintenanceRequests, 'portfolio_admin').filter((request) => request.buildingId === person.buildingId && !['Closed', 'Completed'].includes(request.status)).length} open items`,
    meta: `${84 + index * 3}% SLA response`
  }));
}

function contractorPerformanceRecords(): SimpleRecord[] {
  return contractors.map((contractor, index) => ({
    id: `contractor-${contractor.id}`,
    title: contractor.company,
    buildingId: buildings[index % buildings.length].id,
    owner: contractor.contact,
    status: contractor.rating >= 4.7 ? 'Preferred' : 'Active',
    due: contractor.insuranceExpiry,
    meta: `${contractor.trade} · ${contractor.response} avg response · ${contractor.completed} jobs`
  }));
}

function quoteRecords(): SimpleRecord[] {
  return projects.map((project) => ({
    id: `quote-${project.id}`,
    title: `${project.title} quote package`,
    buildingId: project.buildingId,
    owner: contractors.find((contractor) => contractor.id === project.contractorId)?.company ?? 'Contractor',
    status: project.status === 'Approved' ? 'Approved' : 'Open',
    due: project.nextMilestone,
    amount: Math.round(project.budget * 0.18),
    meta: project.risk
  }));
}

function contractorDocumentRecords(requests: MaintenanceRequest[]): SimpleRecord[] {
  return filterForRole(requests, 'contractor').map((request) => ({
    id: `contractor-doc-${request.id}`,
    title: `${request.title} job brief`,
    buildingId: request.buildingId,
    owner: 'LiftCare NSW',
    status: 'Visible',
    due: request.submitted,
    meta: 'Scope, photos and site access notes'
  }));
}

function contractorMessageRecords(requests: MaintenanceRequest[]): SimpleRecord[] {
  return filterForRole(requests, 'contractor').map((request) => ({
    id: `contractor-msg-${request.id}`,
    title: `${request.title} job comments`,
    buildingId: request.buildingId,
    owner: 'Building manager',
    status: request.status === 'Completed' ? 'Closed' : 'Open',
    due: todayLabel(),
    meta: 'Linked to assigned work order'
  }));
}

function levySummaryByBuilding() {
  return buildings.map((building) => {
    const buildingLevies = levies.filter((levy) => levy.buildingId === building.id);
    return {
      buildingId: building.id,
      buildingName: building.name,
      totalArrears: buildingLevies.reduce((total, levy) => total + levy.outstandingAmount, 0),
      overdueLots: buildingLevies.filter((levy) => levy.status === 'Overdue').length,
      noticesIssued: buildingLevies.length,
      highestRisk: buildingLevies.some((levy) => levy.reminderStatus === 'Escalated')
    };
  });
}

function summaryToRecord(summary: ReturnType<typeof levySummaryByBuilding>[number]): SimpleRecord {
  return {
    id: `summary-${summary.buildingId}`,
    title: summary.buildingName,
    buildingId: summary.buildingId,
    owner: 'Building summary',
    status: summary.highestRisk ? 'Overdue' : 'Open',
    due: `${summary.overdueLots} overdue lots`,
    amount: summary.totalArrears,
    meta: `${summary.noticesIssued} notices issued`
  };
}

function levyToPrivateRecord(levy: LevyRecord): SimpleRecord {
  return {
    id: levy.id,
    title: `Lot ${levy.lot}`,
    buildingId: levy.buildingId,
    owner: levy.owner,
    status: levy.status,
    due: levy.nextDueDate,
    amount: levy.outstandingAmount,
    meta: levy.reminderStatus
  };
}

function cleanActionMessage(message: string) {
  return message
    .replace('Using local seeded test account. Configure Supabase env vars to use Supabase Auth.', 'Workspace ready. Use Switch Role to test each Atlas experience.');
}

function stringPayload(payload: Record<string, string | File>) {
  return Object.fromEntries(Object.entries(payload).filter(([, value]) => typeof value === 'string')) as Record<string, string>;
}

function isNewRecord(record: { id: string; meta?: string; due?: string }) {
  if (record.id.startsWith('new-') || record.meta?.startsWith('New')) return true;
  if (!record.due) return false;
  const createdAt = new Date(record.due).getTime();
  return Number.isFinite(createdAt) && Date.now() - createdAt < 24 * 60 * 60 * 1000;
}

function todayLabel() {
  return '2026-06-06';
}

function HammerIcon(props: ComponentProps<typeof AlertTriangle>) {
  return <AlertTriangle {...props} />;
}

export default App;
