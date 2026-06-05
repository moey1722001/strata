import { useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
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
  Filter,
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
  buildingDirectories,
  buildingName,
  buildings,
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
  notificationChannels,
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
import type { BuildingDirectory, LevyRecord, MaintenanceRequest, Notice, PageId, Priority, Project, ReportIssue, Role, SimpleRecord, TestAccount } from './data';
import { AtlasLogo, AtlasMark } from './brand';
import {
  addContractorUpdate,
  assignContractorToFirstJob,
  createNotice,
  createResidentIssue,
  loadMvpData,
  sendResidentMessage,
  signInTestAccount,
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
  Closed: 'bg-slate-900 text-white ring-slate-900',
  Completed: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Overdue: 'bg-red-50 text-red-700 ring-red-200',
  'Due soon': 'bg-amber-50 text-amber-800 ring-amber-200',
  'In progress': 'bg-blue-50 text-blue-700 ring-blue-200',
  'Committee Review': 'bg-purple-50 text-purple-700 ring-purple-200',
  'Manager Review': 'bg-blue-50 text-blue-700 ring-blue-200',
  'More Info Required': 'bg-amber-50 text-amber-800 ring-amber-200',
  Sent: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  Unread: 'bg-red-50 text-red-700 ring-red-200',
  Visible: 'bg-emerald-50 text-emerald-700 ring-emerald-200'
};

type FlowActions = {
  reportIssue: (payload?: Partial<ReportIssue>) => Promise<void>;
  assignContractor: (id?: string) => Promise<void>;
  updateMaintenanceStatus: (id: string, status: string) => Promise<void>;
  updateIssueStatus: (id: string, status: string) => Promise<void>;
  notifyResident: (id: string) => Promise<void>;
  contractorUpdate: (id?: string, status?: string) => Promise<void>;
  createNotice: () => Promise<void>;
  sendMessage: () => Promise<void>;
  uploadDocument: () => Promise<void>;
  vote: () => Promise<void>;
  bookFacility: () => Promise<void>;
  submitRenovation: () => Promise<void>;
  approveRenovation: (id: string) => Promise<void>;
  requestRenovationInfo: (id: string) => Promise<void>;
  updateFacilityBooking: (id: string, status: string) => Promise<void>;
  recordIncidentUpdate: (id: string) => Promise<void>;
};

function App() {
  const [role, setRole] = useState<Role>('portfolio_admin');
  const [page, setPage] = useState<PageId>('portfolio');
  const [publicView, setPublicView] = useState<'landing' | 'pricing' | 'login' | 'walkthrough' | 'app'>('app');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [currentAccount, setCurrentAccount] = useState<TestAccount | null>(testAccounts.find((account) => account.role === 'portfolio_admin') ?? null);
  const [mvpData, setMvpData] = useState<MvpData>({
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
  });
  const [actionStatus, setActionStatus] = useState('Workspace ready. Use Switch Role to test each Atlas experience.');

  const devRoleSwitcher = true;

  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role]);

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
    loadMvpData(currentAccount, role).then(setMvpData).catch(() => {
      setActionStatus('Could not load Supabase data. Using local seeded data.');
    });
  }, [currentAccount, role]);

  async function loginAs(account: TestAccount) {
    const result = await signInTestAccount(account);
    setCurrentAccount(account);
    setRole(account.role);
    setPage(defaultPageForRole(account.role));
    setPublicView('app');
    setActionStatus(result.message);
  }

  function switchRole(nextRole: Role) {
    const nextAccount = testAccounts.find((account) => account.role === nextRole) ?? currentAccount;
    if (nextAccount) {
      setCurrentAccount(nextAccount);
    }
    setRole(nextRole);
    setPage(defaultPageForRole(nextRole));
  }

  async function runAction(action: () => Promise<MvpActionResult>, mutate?: (current: MvpData) => MvpData) {
    const result = await action();
    if (result.ok && mutate) {
      setMvpData((current) => mutate(current));
    } else if (currentAccount) {
      const latest = await loadMvpData(currentAccount, role);
      setMvpData(latest);
    }
    setActionStatus(cleanActionMessage(result.message));
  }

  const flowActions = {
    reportIssue: (payload?: Partial<ReportIssue>) => runAction(() => createResidentIssue(currentAccount, payload), (current) => {
      const issue = makeReportIssue(payload);
      return appendActivity({
        ...current,
        reportIssues: [issue, ...current.reportIssues],
        maintenanceRequests: [issueToMaintenance(issue), ...current.maintenanceRequests]
      }, 'Issue reported', 'Resident issue received by manager', 'ri');
    }),
    assignContractor: (id?: string) => runAction(() => assignContractorToFirstJob(currentAccount), (current) => {
      const targetId = id ?? current.maintenanceRequests.find((request) => request.buildingId === 'b1')?.id;
      return appendActivity({
        ...current,
        maintenanceRequests: current.maintenanceRequests.map((request) => request.id === targetId ? { ...request, contractorId: 'c3', status: 'Assigned' } : request),
        reportIssues: current.reportIssues.map((issue) => issue.buildingId === 'b1' && ['Triage', 'Open', 'Manager review'].includes(issue.status) ? { ...issue, status: 'Assigned' } : issue)
      }, 'Contractor assigned', 'LiftCare NSW assigned to work order', 'wo');
    }),
    updateMaintenanceStatus: (id: string, status: string) => runAction(() => Promise.resolve({ ok: true, message: `Status updated to ${status}.` }), (current) => appendActivity({
      ...current,
      maintenanceRequests: current.maintenanceRequests.map((request) => request.id === id ? { ...request, status, overdue: false } : request)
    }, 'Maintenance status updated', status, 'mr')),
    updateIssueStatus: (id: string, status: string) => runAction(() => Promise.resolve({ ok: true, message: `Issue moved to ${status}.` }), (current) => appendActivity({
      ...current,
      reportIssues: current.reportIssues.map((issue) => issue.id === id ? { ...issue, status } : issue)
    }, 'Issue triaged', status, 'ri')),
    notifyResident: (id: string) => runAction(() => Promise.resolve({ ok: true, message: 'Resident notified.' }), (current) => appendActivity({
      ...current,
      reportIssues: current.reportIssues.map((issue) => issue.id === id ? { ...issue, status: issue.status === 'Triage' ? 'Under Review' : issue.status } : issue)
    }, 'Resident notified', id, 'nt')),
    contractorUpdate: (id?: string, status = 'In Progress') => runAction(() => addContractorUpdate(currentAccount), (current) => {
      const targetId = id ?? current.maintenanceRequests.find((request) => request.contractorId === 'c3')?.id;
      return appendActivity({
        ...current,
        maintenanceRequests: current.maintenanceRequests.map((request) => request.id === targetId ? { ...request, status, overdue: false } : request),
        messages: [{ id: nextId('msg'), title: `Contractor update: ${status}`, buildingId: 'b1', owner: 'LiftCare NSW', status: 'Open', due: todayLabel(), meta: 'Progress update added' }, ...current.messages]
      }, 'Contractor job updated', status, 'cu');
    }),
    createNotice: () => runAction(() => createNotice(currentAccount), (current) => appendActivity({
      ...current,
      notices: [{
        id: nextId('n'),
        title: 'Lift maintenance update',
        category: 'Maintenance update',
        buildingId: 'b1',
        priority: 'Medium',
        audience: 'All residents',
        publishAt: todayLabel(),
        channels: ['in-app'],
        reads: 0,
        body: 'Lift contractor attendance is scheduled. Residents will be updated after completion.'
      }, ...current.notices]
    }, 'Notice published', 'Residents notified in app', 'n')),
    sendMessage: () => runAction(() => sendResidentMessage(currentAccount), (current) => appendActivity({
      ...current,
      messages: [{ id: nextId('msg'), title: 'Resident message to building manager', buildingId: 'b1', owner: currentAccount?.name ?? 'Resident', status: 'Unread', due: todayLabel(), meta: 'Resident-manager thread' }, ...current.messages]
    }, 'Message sent', 'Building manager inbox updated', 'msg')),
    uploadDocument: () => runAction(() => uploadDocument(currentAccount), (current) => appendActivity({
      ...current,
      documents: [{ id: nextId('d'), title: 'Committee minutes - June', buildingId: 'b1', owner: currentAccount?.name ?? 'Manager', status: 'Visible', due: todayLabel(), meta: 'Meeting minutes' }, ...current.documents]
    }, 'Document uploaded', 'Visible to permitted residents', 'd')),
    vote: () => runAction(() => voteOnMotion(currentAccount), (current) => appendActivity({
      ...current,
      motions: current.motions.map((motion) => motion.id === 'cm2' ? { ...motion, status: 'Approved', meta: '6 yes, 1 abstain' } : motion)
    }, 'Committee vote recorded', 'Motion tally updated', 'cm')),
    bookFacility: () => runAction(() => Promise.resolve({ ok: true, message: 'Facility booking submitted.' }), (current) => appendActivity({
      ...current,
      facilityBookings: [{ id: nextId('fb'), title: 'Rooftop BBQ booking', buildingId: 'b1', owner: currentAccount?.name ?? 'Resident', status: 'Submitted', due: '2026-06-18', meta: 'Awaiting manager approval' }, ...current.facilityBookings]
    }, 'Facility booking submitted', 'Manager approval required', 'fb')),
    submitRenovation: () => runAction(() => Promise.resolve({ ok: true, message: 'Renovation request submitted.' }), (current) => appendActivity({
      ...current,
      renovations: [{ id: nextId('r'), title: 'Apartment renovation request', buildingId: 'b1', owner: currentAccount?.name ?? 'Resident', status: 'Manager Review', due: '2026-06-21', meta: 'Scope, dates and by-law acknowledgement received' }, ...current.renovations]
    }, 'Renovation request submitted', 'Manager review started', 'r')),
    approveRenovation: (id: string) => runAction(() => Promise.resolve({ ok: true, message: 'Renovation request approved.' }), (current) => appendActivity({
      ...current,
      renovations: current.renovations.map((renovation) => renovation.id === id ? { ...renovation, status: 'Approved', meta: 'Approved with standard noise conditions' } : renovation)
    }, 'Renovation approved', id, 'r')),
    requestRenovationInfo: (id: string) => runAction(() => Promise.resolve({ ok: true, message: 'More information requested.' }), (current) => appendActivity({
      ...current,
      renovations: current.renovations.map((renovation) => renovation.id === id ? { ...renovation, status: 'More Info Required', meta: 'Acoustic certificate and contractor insurance requested' } : renovation)
    }, 'Renovation information requested', id, 'r')),
    updateFacilityBooking: (id: string, status: string) => runAction(() => Promise.resolve({ ok: true, message: `Facility booking ${status.toLowerCase()}.` }), (current) => appendActivity({
      ...current,
      facilityBookings: current.facilityBookings.map((booking) => booking.id === id ? { ...booking, status, meta: status === 'Approved' ? 'Resident notified in app' : 'Manager review completed' } : booking)
    }, 'Facility booking updated', status, 'fb')),
    recordIncidentUpdate: (id: string) => runAction(() => Promise.resolve({ ok: true, message: 'Incident updated.' }), (current) => appendActivity({
      ...current,
      incidents: current.incidents.map((incident) => incident.id === id ? { ...incident, status: 'In progress', meta: 'Manager note added and audit trail updated' } : incident)
    }, 'Incident updated', id, 'i'))
  };

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
            <div className="hidden flex-1 items-center gap-3 rounded-full border border-line bg-slate-50 px-4 py-2 text-sm text-slate-500 md:flex">
              <Search size={17} />
              <span>Search buildings, contacts, notices, issues, documents...</span>
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
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="hidden h-10 w-10 place-items-center rounded-full bg-primary text-white sm:grid" aria-label="Atlas workspace">
              <AtlasMark className="h-7 w-7" />
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-4 rounded-2xl border border-line bg-white px-4 py-3 text-sm text-slate-600 shadow-sm">
            {actionStatus}
          </div>
          <PageRouter page={page} role={role} onNavigate={setPage} data={mvpData} actions={flowActions} />
        </main>
      </div>
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
          <form className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            {['Name', 'Company', 'Work email', 'Buildings managed'].map((label) => (
              <label className="mb-4 block" key={label}>
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <input className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" placeholder={label} />
              </label>
            ))}
            <button type="button" className="w-full btn-primary">
              Send request
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function PageRouter({ page, role, onNavigate, data, actions }: { page: PageId; role: Role; onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions }) {
  if (page === 'portfolio' && role === 'super_admin') return <PlatformDashboard onNavigate={onNavigate} data={data} />;
  if (page === 'portfolio' && role === 'manager') return <ManagerDashboard onNavigate={onNavigate} data={data} actions={actions} />;
  if (page === 'portfolio') return <PortfolioDashboard role={role} onNavigate={onNavigate} data={data} />;
  if (page === 'buildings') return <BuildingsPage role={role} />;
  if (page === 'building' && (role === 'manager' || role === 'portfolio_admin')) return <BuildingDashboard role={role} />;
  if (page === 'resident') return <ResidentDashboard role={role} onNavigate={onNavigate} data={data} />;
  if (page === 'committee') return <CommitteeDashboard role={role} onNavigate={onNavigate} data={data} actions={actions} />;
  if (page === 'motions') return <MotionsPage role={role} data={data} actions={actions} />;
  if (page === 'quotes') return <QuotesPage role={role} />;
  if (page === 'meetings') return <MeetingsPage role={role} />;
  if (page === 'contractor') return <ContractorDashboard role={role} data={data} actions={actions} />;
  if (page === 'communications') return <CommunicationsHub role={role} onNavigate={onNavigate} data={data} actions={actions} />;
  if (page === 'report_issue') return <ReportIssuePage role={role} data={data} actions={actions} />;
  if (page === 'directory') return <BuildingDirectoryPage role={role} />;
  if (page === 'my_levies') return <MyLeviesPage role={role} />;
  if (page === 'levy_management' && role === 'portfolio_admin') return <LevyManagementPage role={role} />;
  if (page === 'my_requests') return <MyRequestsPage role={role} data={data} actions={actions} />;
  if (page === 'messages') return <MessagesPage role={role} data={data} actions={actions} />;
  if (page === 'documents') return <DocumentsPage role={role} data={data} actions={actions} />;
  if (page === 'maintenance') return <MaintenancePage role={role} data={data} actions={actions} />;
  if (page === 'projects') return <ProjectsPage role={role} />;
  if (page === 'facilities') return <FacilitiesPage role={role} data={data} actions={actions} />;
  if (page === 'renovations') return <RenovationsPage role={role} data={data} actions={actions} />;
  if (page === 'packages' && role === 'resident') return <PackagesPage role={role} data={data} />;
  if (page === 'incidents') return <IncidentsPage role={role} data={data} actions={actions} />;
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
    compliance: { title: 'Compliance Dashboard', eyebrow: 'AFSS, lifts, insurance, WHS and Strata Hub', records: complianceItems, cta: 'Add compliance item' },
    documents: { title: 'Documents Library', eyebrow: 'Permissions, versions, search and downloads', records: data.documents, cta: 'Upload document' },
    facilities: { title: '', eyebrow: '', records: [], cta: '' },
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

function ManagerDashboard({ onNavigate, data, actions }: { onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions }) {
  const assignedBuildings = buildings.filter((building) => roleBuildingScope.manager.includes(building.id));
  const openIssues = data.maintenanceRequests.filter((request) => assignedBuildings.some((building) => building.id === request.buildingId) && !['Completed', 'Closed', 'Rejected'].includes(request.status));
  const overdue = openIssues.filter((request) => request.overdue);
  const emergencyIssues = filterForRole(data.reportIssues, 'manager').filter((issue) => issue.severity === 'Emergency' || issue.severity === 'High');
  const renovationApprovals = filterForRole(data.renovations, 'manager').filter((item) => ['Manager Review', 'Committee Review', 'More Info Required'].includes(item.status));
  const contractorUpdates = filterForRole(data.messages, 'manager').filter((message) => message.title.toLowerCase().includes('contractor') || message.meta?.toLowerCase().includes('contractor'));
  const upcomingMeetings = filterForRole(meetings, 'manager').slice(0, 3);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Manager workspace" title="Assigned buildings need attention" action={<button className="btn-primary" onClick={() => onNavigate('communications')}><Bell size={17} /> Create notice</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Assigned buildings" value={assignedBuildings.length.toString()} detail="Harbourline, Glebe Foundry" icon={Building2} />
        <Metric title="Emergency issues" value={emergencyIssues.length.toString()} detail={`${overdue.length} overdue work orders`} icon={AlertTriangle} tone="red" />
        <Metric title="Compliance risks" value={complianceItems.filter((item) => assignedBuildings.some((building) => building.id === item.buildingId) && item.status !== 'Open').length.toString()} detail="Due soon or overdue" icon={ShieldCheck} tone="red" />
        <Metric title="Unread messages" value={filterForRole(data.messages, 'manager').filter((message) => message.status === 'Unread').length.toString()} detail="Resident and contractor threads" icon={MessageSquare} tone="blue" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Issue triage queue" action={<button className="btn-secondary" onClick={() => onNavigate('maintenance')}><ArrowRight size={16} /> Open maintenance</button>}>
          <ReportIssueList issues={filterForRole(data.reportIssues, 'manager')} managerView actions={actions} />
        </Panel>
        <Panel title="Attention list">
          <RecordTable records={[
            ...renovationApprovals.slice(0, 2),
            ...contractorUpdates.slice(0, 2),
            ...upcomingMeetings
          ]} />
        </Panel>
      </div>
    </div>
  );
}

function PortfolioDashboard({ role, onNavigate, data }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData }) {
  const scopedBuildings = role === 'manager' ? buildings.slice(0, 2) : buildings;
  const openMaintenance = filterForRole(data.maintenanceRequests, role).filter((request) => !['Completed', 'Closed', 'Rejected'].includes(request.status));
  const overdue = openMaintenance.filter((request) => request.overdue);
  const arrears = scopedBuildings.reduce((total, building) => total + building.arrears, 0);
  const spend = scopedBuildings.reduce((total, building) => total + building.maintenanceSpend, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={role === 'super_admin' ? 'Platform control centre' : 'Portfolio command'}
        title={role === 'super_admin' ? 'SaaS platform overview' : 'Northshore Strata Co. portfolio'}
        action={<button className="btn-primary" onClick={() => onNavigate('reports')}><FileText size={17} /> Open reports</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Buildings" value={scopedBuildings.length.toString()} detail={`${scopedBuildings.reduce((total, building) => total + building.lots, 0)} lots`} icon={Building2} />
        <Metric title="Open maintenance" value={openMaintenance.length.toString()} detail={`${overdue.length} overdue`} icon={HammerIcon} tone="amber" />
        <Metric title={role === 'portfolio_admin' ? 'Portfolio arrears' : 'Platform revenue'} value={role === 'portfolio_admin' ? currency(arrears) : currency(company.mrr)} detail={role === 'portfolio_admin' ? 'Company-wide levy risk' : 'Monthly recurring revenue'} icon={DollarSign} tone="green" />
        <Metric title="Compliance risk" value={`${complianceItems.filter((item) => item.status === 'Overdue').length} overdue`} detail="AFSS, insurance, lifts" icon={ShieldCheck} tone="red" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Buildings needing attention" action={<ComingSoonButton icon={<Filter size={16} />} label="Filter" />}>
          <div className="space-y-3">
            {[...scopedBuildings].sort((a, b) => b.complaints - a.complaints).map((building) => (
              <div key={building.id} className="rounded-2xl border border-line p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h3 className="font-semibold">{building.name}</h3>
                    <p className="text-sm text-slate-500">{building.address}</p>
                  </div>
                  <Badge label={`${building.complaints} complaints`} tone={building.complaints > 15 ? 'Emergency' : 'Medium'} />
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-4">
                  <MiniStat label="Satisfaction" value={`${building.satisfaction}%`} />
                  <MiniStat label="Arrears" value={currency(building.arrears)} />
                  <MiniStat label="Spend" value={currency(building.maintenanceSpend)} />
                  <MiniStat label="Margin" value={`${building.profit}%`} />
                </div>
              </div>
            ))}
          </div>
        </Panel>
        <Panel title="Performance signals">
          <div className="space-y-4">
            <Score label="Resident satisfaction" value={89} />
            <Score label="Staff performance" value={92} />
            <Score label="Contractor performance" value={87} />
            <Score label="Portfolio profitability" value={78} />
            <div className="rounded-2xl bg-ink p-4 text-white">
              <p className="text-sm text-slate-300">Maintenance spend</p>
              <p className="mt-2 text-2xl font-semibold">{currency(spend)}</p>
              <p className="mt-1 text-sm text-slate-300">Levy arrears across scope: {currency(arrears)}</p>
            </div>
          </div>
        </Panel>
        {role === 'portfolio_admin' && (
          <Panel title="Portfolio levy arrears" className="xl:col-span-2" action={<button className="btn-secondary" onClick={() => onNavigate('levy_management')}><ArrowRight size={16} /> Levy management</button>}>
            <PortfolioLevySummary />
          </Panel>
        )}
      </div>
    </div>
  );
}

function BuildingsPage({ role }: { role: Role }) {
  const scopedBuildings = role === 'manager' ? buildings.slice(0, 2) : buildings;
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Buildings" title="Managed schemes" action={<ComingSoonButton primary icon={<Plus size={17} />} label="Add building" />} />
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
              <MiniStat label="Open jobs" value={maintenanceRequests.filter((request) => request.buildingId === building.id && request.status !== 'Closed').length.toString()} />
              <MiniStat label="Compliance" value={complianceItems.filter((item) => item.buildingId === building.id && item.status === 'Overdue').length ? 'At risk' : 'On track'} />
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function BuildingDashboard({ role }: { role: Role }) {
  const building = role === 'manager' ? buildings[0] : buildings[3];
  const buildingMaintenance = maintenanceRequests.filter((request) => request.buildingId === building.id);
  const directory = buildingDirectories.find((item) => item.buildingId === building.id) ?? buildingDirectories[0];
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Building dashboard" title={building.name} action={<ComingSoonButton primary icon={<Bell size={17} />} label="Create alert" />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Lots" value={building.lots.toString()} detail={building.address} icon={Building2} />
        <Metric title="Open issues" value={buildingMaintenance.filter((item) => item.status !== 'Closed').length.toString()} detail="Maintenance and incidents" icon={AlertTriangle} tone="amber" />
        <Metric title="Active projects" value={projects.filter((project) => project.buildingId === building.id).length.toString()} detail="Committee visible" icon={Vote} tone="blue" />
        <Metric title="Compliance risk" value={complianceItems.filter((item) => item.buildingId === building.id && item.status === 'Overdue').length.toString()} detail="Overdue items" icon={ShieldCheck} tone="red" />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <Panel title="Building profile">
          <DetailRows rows={[
            ['Address', building.address],
            ['Assigned manager', building.manager],
            ['Committee members', committeeMembers.filter((person) => person.buildingId === building.id).map((person) => person.name).join(', ') || '4 seeded members'],
            ['Facility bookings', facilityBookings.filter((item) => item.buildingId === building.id).length.toString()],
            ['Documents', documents.filter((item) => item.buildingId === building.id).length.toString()]
          ]} />
        </Panel>
        <DirectoryPanel directory={directory} />
        <Panel title="Upcoming and active" className="xl:col-span-2">
          <RecordTable records={[...filterForRole(notices, role).slice(0, 3).map(noticeToRecord), ...buildingMaintenance.slice(0, 3).map(maintenanceToRecord)]} />
        </Panel>
      </div>
    </div>
  );
}

function ResidentDashboard({ role, onNavigate, data }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData }) {
  const feed = filterForRole(data.notices, role);
  const ownRequests = filterPrivateForRole(data.maintenanceRequests, role);
  const upcomingBooking = filterPrivateForRole(data.facilityBookings, role)[0];
  const awaitingPackage = filterPrivateForRole(data.packages, role).find((item) => item.status === 'Awaiting collection');
  const directory = buildingDirectories[0];
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <SectionHeader eyebrow="Resident home" title="Harbourline Residences" action={<button className="btn-primary" onClick={() => onNavigate('report_issue')}><Plus size={17} /> Report issue</button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Notices" value={feed.length.toString()} detail="Latest building updates" icon={Bell} />
        <Metric title="Open request" value={ownRequests[0]?.status ?? 'Clear'} detail={ownRequests[0]?.title ?? 'No active requests'} icon={Clock3} tone="amber" />
        <Metric title="Next booking" value={upcomingBooking?.due ?? 'None'} detail={upcomingBooking?.title ?? 'No bookings scheduled'} icon={CalendarDays} tone="blue" />
        <Metric title="Package" value={awaitingPackage ? 'Waiting' : 'Clear'} detail={awaitingPackage?.title ?? 'No packages awaiting collection'} icon={FileText} tone="green" />
      </div>
      <div className="grid gap-5 lg:grid-cols-[1.1fr_0.9fr]">
        <Panel title="Building feed">
          <div className="space-y-3">
            {feed.slice(0, 6).map((notice) => (
              <article className="rounded-2xl border border-line p-4" key={notice.id}>
                <div className="flex items-center justify-between gap-3">
                  <Badge label={notice.category} tone={notice.priority} />
                  <span className="text-xs text-slate-500">{notice.publishAt}</span>
                </div>
                <h3 className="mt-3 font-semibold">{notice.title}</h3>
                <p className="mt-1 text-sm leading-6 text-slate-600">{notice.body}</p>
              </article>
            ))}
          </div>
        </Panel>
        <Panel title="Your quick actions">
          <div className="grid gap-3">
            {[
              ['See notices', 'communications'],
              ['Report an issue', 'report_issue'],
              ['View documents', 'documents'],
              ['Book facilities', 'facilities'],
              ['View my levies', 'my_levies'],
              ['Check building contacts', 'directory'],
              ['Track requests', 'my_requests']
            ].map(([label, target]) => (
              <button className="flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-left hover:bg-slate-50" key={label} onClick={() => onNavigate(target as PageId)}>
                <span className="font-medium">{label}</span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </Panel>
        <DirectoryPanel directory={directory} className="lg:col-span-2" />
      </div>
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
                  <button className="btn-secondary" onClick={actions.vote}>Vote yes</button>
                  <ComingSoonButton label="Abstain" />
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
  const assigned = filterForRole(data.maintenanceRequests, role).filter((request) => request.contractorId);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Contractor portal" title="Assigned jobs and compliance" action={<ComingSoonButton primary icon={<Download size={17} />} label="Upload invoice" />} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Assigned jobs" value={assigned.length.toString()} detail="Across permitted buildings" icon={Clock3} />
        <Metric title="In progress" value={assigned.filter((item) => item.status === 'In Progress').length.toString()} detail="Roster today" icon={CheckCircle2} tone="blue" />
        <Metric title="Quotes requested" value="2" detail="Upload quote PDFs" icon={FileText} tone="amber" />
        <Metric title="Insurance expiry" value="17 days" detail="Reminder active" icon={ShieldCheck} tone="red" />
      </div>
      <MaintenanceCards requests={assigned} contractorView onContractorUpdate={actions.contractorUpdate} onStatusUpdate={(id) => actions.contractorUpdate(id, 'Viewed')} />
    </div>
  );
}

function CommunicationsHub({ role, onNavigate, data, actions }: { role: Role; onNavigate: (page: PageId) => void; data: MvpData; actions: FlowActions }) {
  const [activeTab, setActiveTab] = useState<'Feed' | 'Notices' | 'Messages' | 'Alerts'>('Feed');
  const scopedNotices = filterForRole(data.notices, role);
  const scopedMessages = role === 'resident' || role === 'committee' ? filterPrivateForRole(data.messages, role) : filterForRole(data.messages, role);
  const scopedAlerts = filterForRole(data.notifications, role);
  const tabs = ['Feed', 'Notices', 'Messages', 'Alerts'] as const;
  const recordsByTab: Record<typeof activeTab, SimpleRecord[]> = {
    Feed: scopedNotices.slice(0, 8).map(noticeToRecord),
    Notices: scopedNotices.map(noticeToRecord),
    Messages: scopedMessages,
    Alerts: scopedAlerts
  };

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Communications Hub" title="Feed, notices, messages and alerts" action={<button className="btn-primary" onClick={role === 'manager' || role === 'portfolio_admin' ? actions.createNotice : () => onNavigate('messages')}><Plus size={17} /> {role === 'manager' || role === 'portfolio_admin' ? 'Create notice' : 'Message manager'}</button>} />
      <Panel title="Communication centre" action={<NotificationRules />}>
        <div className="mb-5 flex flex-wrap gap-2">
          {tabs.map((tabName) => (
            <button key={tabName} className={`tab-button ${activeTab === tabName ? 'tab-button-active' : ''}`} onClick={() => setActiveTab(tabName)}>
              {tabName}
            </button>
          ))}
        </div>
        {activeTab === 'Feed' ? (
          <div className="grid gap-4 lg:grid-cols-2">
            {scopedNotices.slice(0, 6).map((notice) => <NoticeCard notice={notice} key={notice.id} />)}
          </div>
        ) : (
          <RecordTable records={recordsByTab[activeTab]} />
        )}
      </Panel>
    </div>
  );
}

function ReportIssuePage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const scopedIssues = filterPrivateForRole(data.reportIssues, role);
  const categories: ReportIssue['category'][] = ['Maintenance', 'Damage', 'Security', 'Noise', 'Safety', 'Other'];
  const [selectedCategory, setSelectedCategory] = useState<ReportIssue['category']>('Maintenance');

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="Report Issue" title="One simple flow for residents" action={<button className="btn-primary" onClick={() => actions.reportIssue({ category: selectedCategory })}><Plus size={17} /> Submit issue</button>} />
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="New issue">
          <div className="grid gap-4">
            <label>
              <span className="text-sm font-medium text-slate-600">Category</span>
              <div className="mt-2 grid grid-cols-2 gap-2">
                {categories.map((category) => (
                  <button
                    className={`rounded-2xl border px-3 py-3 text-sm font-semibold hover:bg-slate-50 ${selectedCategory === category ? 'border-ink bg-slate-50 text-ink' : 'border-line text-slate-600'}`}
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </label>
            <label>
              <span className="text-sm font-medium text-slate-600">What happened?</span>
              <textarea className="mt-2 min-h-28 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" placeholder="Describe the issue, location and urgency" />
            </label>
            <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-600">
              The system routes each report into maintenance, incidents, or both based on category and severity.
            </div>
          </div>
        </Panel>
        <Panel title="Your tracked issues">
          <ReportIssueList issues={scopedIssues} />
        </Panel>
      </div>
    </div>
  );
}

function BuildingDirectoryPage({ role }: { role: Role }) {
  const directories = filterForRole(buildingDirectories, role);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Building Directory" title="Contacts residents need quickly" action={<ComingSoonButton primary icon={<Plus size={17} />} label="Update contacts" />} />
      <div className="grid gap-5 lg:grid-cols-2">
        {directories.map((directory) => <DirectoryPanel directory={directory} key={directory.buildingId} />)}
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
      <SectionHeader eyebrow="My Requests" title="Track reported issues" action={<button className="btn-primary" onClick={() => actions.reportIssue()}><Plus size={17} /> Report issue</button>} />
      <Panel title="Request progress">
        <ReportIssueList issues={filterPrivateForRole(data.reportIssues, role)} />
      </Panel>
    </div>
  );
}

function MessagesPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const records = role === 'contractor'
    ? contractorMessageRecords(data.maintenanceRequests)
    : role === 'resident' || role === 'committee'
      ? filterPrivateForRole(data.messages, role)
      : filterForRole(data.messages, role);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Messages" title="Building conversations and manager replies" action={(role === 'resident' || role === 'committee') ? <button className="btn-primary" onClick={actions.sendMessage}><MessageSquare size={17} /> Send message</button> : undefined} />
      <Panel title="Conversations">
        <RecordTable records={records} />
      </Panel>
    </div>
  );
}

function DocumentsPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const records = role === 'contractor'
    ? contractorDocumentRecords(data.maintenanceRequests)
    : filterForRole(data.documents, role);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Documents"
        title={role === 'resident' ? 'Building documents' : 'Document library'}
        action={(role === 'manager' || role === 'portfolio_admin') ? <button className="btn-primary" onClick={actions.uploadDocument}><Plus size={17} /> Upload document</button> : undefined}
      />
      <Panel title="Available documents">
        <RecordTable records={records} />
      </Panel>
    </div>
  );
}

function MaintenancePage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  if (role === 'contractor') {
    const assigned = filterForRole(data.maintenanceRequests, 'contractor');
    return (
      <div className="space-y-6">
        <SectionHeader eyebrow="Assigned Jobs" title="LiftCare NSW work queue" />
        <MaintenanceCards requests={assigned} contractorView onContractorUpdate={actions.contractorUpdate} onStatusUpdate={(id) => actions.contractorUpdate(id, 'Viewed')} />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Maintenance" title="Internal triage, contractors and SLA timers" action={<ComingSoonButton primary icon={<Plus size={17} />} label="New internal job" />} />
      <div className="grid gap-5 xl:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Resident issues to triage">
          <ReportIssueList issues={filterForRole(data.reportIssues, role)} managerView actions={actions} />
        </Panel>
        <Panel title="Maintenance jobs">
          <MaintenanceCards requests={filterForRole(data.maintenanceRequests, role)} compact onAssignContractor={actions.assignContractor} onStatusUpdate={actions.updateMaintenanceStatus} />
        </Panel>
      </div>
    </div>
  );
}

function FacilitiesPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const records = role === 'resident' ? filterPrivateForRole(data.facilityBookings, role) : filterForRole(data.facilityBookings, role);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Facility Bookings"
        title={role === 'resident' || role === 'committee' ? 'Book building facilities' : 'Facility approvals'}
        action={(role === 'resident' || role === 'committee') ? <button className="btn-primary" onClick={actions.bookFacility}><Plus size={17} /> Book facility</button> : undefined}
      />
      <Panel title={role === 'manager' || role === 'portfolio_admin' ? 'Bookings awaiting review' : 'My bookings'}>
        <RecordTable records={records} />
      </Panel>
      {(role === 'manager' || role === 'portfolio_admin') && (
        <div className="grid gap-4 lg:grid-cols-2">
          {records.map((booking) => (
            <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={booking.id}>
              <Badge label={booking.status} />
              <h3 className="mt-3 font-semibold">{booking.title}</h3>
              <p className="mt-1 text-sm text-slate-500">{buildingName(booking.buildingId)} · {booking.owner}</p>
              <p className="mt-3 text-sm text-slate-600">{booking.meta}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <button className="btn-secondary" onClick={() => actions.updateFacilityBooking(booking.id, 'Approved')}>Approve</button>
                <button className="btn-secondary" onClick={() => actions.updateFacilityBooking(booking.id, 'Closed')}>Decline</button>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}

function RenovationsPage({ role, data, actions }: { role: Role; data: MvpData; actions: FlowActions }) {
  const records = filterForRole(data.renovations, role);
  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow="Renovation Approvals"
        title={role === 'resident' || role === 'committee' ? 'Renovation requests' : 'Review renovation requests'}
        action={(role === 'resident' || role === 'committee') ? <button className="btn-primary" onClick={actions.submitRenovation}><Plus size={17} /> Submit request</button> : undefined}
      />
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

function PackagesPage({ role, data }: { role: Role; data: MvpData }) {
  const records = filterPrivateForRole(data.packages, role).filter((pkg) => pkg.status === 'Awaiting collection');
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="Packages" title="Package notifications" />
      <Panel title="Awaiting collection">
        <RecordTable records={records} />
      </Panel>
    </div>
  );
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
              <button className="btn-secondary" onClick={() => actions.updateMaintenanceStatus('mr1', 'Assigned')}>Link work order</button>
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
              <button className="btn-secondary" onClick={actions.vote}>Vote yes</button>
              <ComingSoonButton label="Abstain" />
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

function NoticeCard({ notice }: { notice: Notice }) {
  return (
    <article className="rounded-3xl border border-line bg-white p-5">
      <div className="flex items-center justify-between gap-3">
        <Badge label={notice.priority} tone={notice.priority} />
        <span className="text-xs text-slate-500">{notice.reads} reads</span>
      </div>
      <h2 className="mt-4 text-lg font-semibold">{notice.title}</h2>
      <p className="mt-2 text-sm text-slate-500">{buildingName(notice.buildingId)} · {notice.audience}</p>
      <p className="mt-4 text-sm leading-6 text-slate-600">{notice.body}</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {notice.channels.map((channel) => <span className="chip" key={channel}>{channel}</span>)}
      </div>
    </article>
  );
}

function NotificationRules() {
  return (
    <div className="hidden gap-2 xl:flex">
      {(['Low', 'Medium', 'High', 'Emergency'] as Priority[]).map((priority) => (
        <span className="chip" key={priority}>{priority}: {notificationChannels(priority).join(' + ')}</span>
      ))}
    </div>
  );
}

function ReportIssueList({ issues, managerView = false, actions }: { issues: ReportIssue[]; managerView?: boolean; actions?: FlowActions }) {
  return (
    <div className="space-y-3">
      {issues.map((issue) => (
        <article className="rounded-2xl border border-line p-4" key={issue.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge label={issue.severity} tone={issue.severity} />
            <Badge label={issue.status} />
          </div>
          <h3 className="mt-3 font-semibold">{issue.title}</h3>
          <p className="mt-1 text-sm text-slate-500">{issue.category} · Lot {issue.unit} · {issue.submitted}</p>
          <p className="mt-3 text-sm text-slate-600">{managerView ? `Route to: ${issue.outcome}` : `Progress: ${issue.status} · ${issue.outcome}`}</p>
          {managerView && (
            <div className="mt-4 flex flex-wrap gap-2">
              <button className="btn-secondary" onClick={() => actions?.updateIssueStatus(issue.id, 'Under Review')}>Triage</button>
              <button className="btn-secondary" onClick={() => actions?.assignContractor()}>Assign contractor</button>
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

function DirectoryPanel({ directory, className = '' }: { directory: BuildingDirectory; className?: string }) {
  return (
    <Panel title={`${buildingName(directory.buildingId)} contacts`} className={className}>
      <DetailRows rows={[
        ['Strata manager', directory.strataManager],
        ['Building manager', directory.buildingManager],
        ['Concierge', directory.concierge],
        ['Emergency', directory.emergencyContact],
        ['After hours', directory.afterHoursContact],
        ['Company phone', directory.companyPhone],
        ['Company email', directory.companyEmail]
      ]} />
    </Panel>
  );
}

function WorkOrdersPage({ role }: { role: Role }) {
  const records = filterForRole(maintenanceRequests, role).map(maintenanceToRecord);
  return <ModulePage title="Work Orders" eyebrow="Assign contractors, approve quotes, track progress and close jobs" records={records} cta="Create work order" />;
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
  return (
    <div className={`grid gap-4 ${compact ? '' : 'lg:grid-cols-2'}`}>
      {requests.map((request) => (
        <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={request.id}>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <Badge label={request.priority} tone={request.priority} />
            <Badge label={request.overdue ? 'Overdue' : request.status} />
          </div>
          <h2 className="mt-4 text-lg font-semibold">{request.title}</h2>
          <p className="mt-1 text-sm text-slate-500">{buildingName(request.buildingId)} · Lot {request.unit} · {request.category}</p>
          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            <MiniStat label={contractorView ? 'Contact' : 'Resident'} value={request.resident} />
            <MiniStat label="SLA" value={`${request.slaHours}h`} />
            <MiniStat label="Access" value={request.access.includes('Permission') ? 'Permitted' : 'By appointment'} />
          </div>
          <div className="mt-5 flex flex-wrap gap-2">
            <button className="btn-secondary" onClick={() => onStatusUpdate?.(request.id, request.status === 'Closed' ? 'Under Review' : request.status)}><Eye size={16} /> Open details</button>
            {contractorView ? (
              <>
                <button className="btn-secondary" onClick={() => onContractorUpdate?.(request.id, 'In Progress')}><MessageSquare size={16} /> Add update</button>
                <ComingSoonButton label="Upload photo" />
                <button className="btn-secondary" onClick={() => onContractorUpdate?.(request.id, 'In Progress')}>Mark in progress</button>
                <button className="btn-secondary" onClick={() => onContractorUpdate?.(request.id, 'Completed')}>Mark completed</button>
              </>
            ) : (
              <>
                <button className="btn-secondary" onClick={() => onStatusUpdate?.(request.id, 'Under Review')}>Review</button>
                <button className="btn-secondary" onClick={() => onAssignContractor?.(request.id)}>Assign contractor</button>
                <button className="btn-secondary" onClick={() => onStatusUpdate?.(request.id, 'Scheduled')}>Schedule</button>
                <button className="btn-secondary" onClick={() => onStatusUpdate?.(request.id, 'Closed')}>Close</button>
              </>
            )}
          </div>
        </article>
      ))}
    </div>
  );
}

function RecordTable({ records }: { records: SimpleRecord[] }) {
  return (
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
              <td className="py-4 pr-4 font-medium">{record.title}</td>
              <td className="py-4 pr-4 text-slate-600">{buildingName(record.buildingId)}</td>
              <td className="py-4 pr-4 text-slate-600">{record.owner}</td>
              <td className="py-4 pr-4"><Badge label={record.status} tone={record.priority} /></td>
              <td className="py-4 pr-4 text-slate-600">{record.due ?? 'Not set'}</td>
              <td className="py-4 pr-4 text-slate-600">{record.amount ? currency(record.amount) : record.meta}</td>
            </tr>
          ))}
        </tbody>
      </table>
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

function todayLabel() {
  return '2026-06-05';
}

function nextId(prefix: string) {
  return `${prefix}-${Date.now()}`;
}

function makeReportIssue(payload?: Partial<ReportIssue>): ReportIssue {
  const category = payload?.category ?? 'Maintenance';
  const severity = payload?.severity ?? (category === 'Safety' ? 'High' : 'Medium');
  return {
    id: nextId('ri'),
    title: payload?.title ?? `${category} issue reported`,
    category,
    severity,
    buildingId: 'b1',
    unit: '1A',
    resident: 'Sienna Nguyen',
    outcome: category === 'Maintenance' ? 'Maintenance request' : category === 'Damage' || category === 'Safety' ? 'Maintenance request + incident' : 'Incident',
    status: 'Triage',
    submitted: todayLabel()
  };
}

function issueToMaintenance(issue: ReportIssue): MaintenanceRequest {
  return {
    id: nextId('mr'),
    title: issue.title,
    category: issue.category,
    buildingId: issue.buildingId,
    unit: issue.unit,
    resident: issue.resident,
    priority: issue.severity,
    status: 'Submitted',
    submitted: issue.submitted,
    slaHours: issue.severity === 'Emergency' ? 4 : issue.severity === 'High' ? 12 : 48,
    overdue: false,
    access: 'Resident appointment required'
  };
}

function appendActivity(data: MvpData, title: string, meta: string, prefix: string): MvpData {
  const record = {
    id: nextId(prefix),
    title,
    buildingId: 'b1',
    owner: 'System',
    status: 'Recorded',
    due: todayLabel(),
    meta
  };
  return {
    ...data,
    notifications: [{ ...record, status: 'Unread', meta: 'In-app' }, ...data.notifications],
    auditLogs: [record, ...data.auditLogs]
  };
}

function HammerIcon(props: ComponentProps<typeof AlertTriangle>) {
  return <AlertTriangle {...props} />;
}

export default App;
