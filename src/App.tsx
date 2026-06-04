import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Bell,
  Bot,
  Building2,
  CalendarDays,
  CheckCircle2,
  ChevronDown,
  Clock3,
  DollarSign,
  Download,
  Eye,
  FileText,
  Filter,
  Menu,
  MessageSquare,
  Plus,
  Search,
  Send,
  ShieldCheck,
  Sparkles,
  UserPlus,
  Vote,
  X
} from 'lucide-react';
import {
  auditLogs,
  assets,
  buildingName,
  buildings,
  committeeMembers,
  company,
  complianceItems,
  contractors,
  currency,
  documents,
  facilityBookings,
  filterForRole,
  incidents,
  inspections,
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
  renovations,
  roleLabels,
  staff
} from './data';
import type { MaintenanceRequest, Notice, PageId, Priority, Project, Role, SimpleRecord } from './data';

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

function App() {
  const [role, setRole] = useState<Role>('portfolio_admin');
  const [page, setPage] = useState<PageId>('portfolio');
  const [publicView, setPublicView] = useState<'landing' | 'pricing' | 'login' | 'demo' | 'app'>('landing');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const visibleNav = useMemo(() => navItems.filter((item) => item.roles.includes(role)), [role]);

  function enterApp(nextRole = role) {
    setRole(nextRole);
    setPublicView('app');
    const defaultPageByRole: Record<Role, PageId> = {
      super_admin: 'portfolio',
      portfolio_admin: 'portfolio',
      manager: 'portfolio',
      resident: 'resident',
      committee: 'committee',
      contractor: 'contractor'
    };
    setPage(defaultPageByRole[nextRole]);
  }

  if (publicView !== 'app') {
    return <PublicSite view={publicView} setView={setPublicView} enterApp={enterApp} />;
  }

  return (
    <div className="min-h-screen bg-mist text-ink">
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 border-r border-line bg-white/95 backdrop-blur xl:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform`}>
        <div className="flex h-16 items-center justify-between border-b border-line px-5">
          <button className="flex items-center gap-3 text-left" onClick={() => setPublicView('landing')}>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white shadow-soft">
              <Building2 size={20} />
            </span>
            <span>
              <span className="block text-base font-semibold tracking-tight">StrataOS</span>
              <span className="block text-xs text-slate-500">Northshore Strata Co.</span>
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
                key={item.id}
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
              <span>Search notices, lots, work orders, documents...</span>
            </div>
            <select
              value={role}
              onChange={(event) => enterApp(event.target.value as Role)}
              className="ml-auto rounded-full border border-line bg-white px-3 py-2 text-sm font-medium text-ink shadow-sm"
            >
              {Object.entries(roleLabels).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
            <button className="icon-button" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <div className="hidden h-10 w-10 place-items-center rounded-full bg-navy text-sm font-semibold text-white sm:grid">
              OS
            </div>
          </div>
        </header>
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <PageRouter page={page} role={role} />
        </main>
      </div>
    </div>
  );
}

function PublicSite({
  view,
  setView,
  enterApp
}: {
  view: 'landing' | 'pricing' | 'login' | 'demo';
  setView: (view: 'landing' | 'pricing' | 'login' | 'demo' | 'app') => void;
  enterApp: (role?: Role) => void;
}) {
  return (
    <div className="min-h-screen bg-white text-ink">
      <header className="sticky top-0 z-30 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <button className="flex items-center gap-3" onClick={() => setView('landing')}>
            <span className="grid h-10 w-10 place-items-center rounded-2xl bg-ink text-white">
              <Building2 size={20} />
            </span>
            <span className="text-lg font-semibold tracking-tight">StrataOS</span>
          </button>
          <div className="hidden items-center gap-6 text-sm font-medium text-slate-600 md:flex">
            <button onClick={() => setView('landing')}>Product</button>
            <button onClick={() => setView('pricing')}>Pricing</button>
            <button onClick={() => setView('demo')}>Request demo</button>
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
                <h1 className="mt-6 max-w-3xl text-5xl font-semibold tracking-tight text-white sm:text-6xl lg:text-7xl">StrataOS</h1>
                <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200">
                  A premium multi-tenant operating system for strata companies managing buildings, residents, committees,
                  contractors, levies, compliance and communications.
                </p>
                <div className="mt-8 flex flex-wrap gap-3">
                  <button className="btn-light" onClick={() => setView('demo')}>
                    Request demo <ArrowRight size={17} />
                  </button>
                  <button className="btn-ghost-dark" onClick={() => enterApp('portfolio_admin')}>
                    Open MVP prototype
                  </button>
                </div>
              </div>
              <div className="dashboard-preview">
                <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                  <span className="text-sm font-semibold text-white">Portfolio risk command</span>
                  <span className="pill bg-emerald-400/15 text-emerald-100 ring-emerald-300/20">Live demo data</span>
                </div>
                <div className="grid gap-3 p-5">
                  {['Emergency incidents', 'Overdue maintenance', 'Committee votes', 'AFSS lodgements'].map((item, index) => (
                    <div className="rounded-2xl border border-white/10 bg-white/10 p-4" key={item}>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-slate-200">{item}</span>
                        <span className="text-xl font-semibold text-white">{[3, 7, 2, 4][index]}</span>
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
                ['Resident simplicity', 'Mobile-first notices, maintenance, bookings, packages, documents and project updates.'],
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
          <SectionHeader eyebrow="Pricing" title="Plans for growing strata portfolios" action={<button className="btn-primary" onClick={() => setView('demo')}>Request demo</button>} />
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
                <button className="mt-6 w-full btn-secondary">Choose plan</button>
              </article>
            ))}
          </div>
        </section>
      )}

      {view === 'login' && (
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="pill bg-navy text-white">Seeded authentication</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">Choose a demo role</h1>
            <p className="mt-4 text-slate-600">Persistent Supabase sessions can be connected next. For now the MVP uses role switching to verify permissions quickly.</p>
          </div>
          <div className="rounded-3xl border border-line bg-white p-4 shadow-soft">
            {Object.entries(roleLabels).map(([key, label]) => (
              <button key={key} className="flex w-full items-center justify-between rounded-2xl px-4 py-4 text-left hover:bg-slate-50" onClick={() => enterApp(key as Role)}>
                <span>
                  <span className="block font-semibold">{label}</span>
                  <span className="block text-sm text-slate-500">Open role-based workspace</span>
                </span>
                <ArrowRight size={18} />
              </button>
            ))}
          </div>
        </section>
      )}

      {view === 'demo' && (
        <section className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="pill bg-gold/10 text-gold ring-gold/20">Request demo</span>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight">Show StrataOS to your portfolio team</h1>
            <p className="mt-4 text-slate-600">Capture lead details now, wire CRM/email automation later.</p>
          </div>
          <form className="rounded-3xl border border-line bg-white p-6 shadow-soft">
            {['Name', 'Company', 'Work email', 'Buildings managed'].map((label) => (
              <label className="mb-4 block" key={label}>
                <span className="text-sm font-medium text-slate-600">{label}</span>
                <input className="mt-2 w-full rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" placeholder={label} />
              </label>
            ))}
            <button type="button" className="w-full btn-primary" onClick={() => enterApp('portfolio_admin')}>
              Open demo workspace
            </button>
          </form>
        </section>
      )}
    </div>
  );
}

function PageRouter({ page, role }: { page: PageId; role: Role }) {
  if (page === 'portfolio') return <PortfolioDashboard role={role} />;
  if (page === 'buildings') return <BuildingsPage role={role} />;
  if (page === 'building') return <BuildingDashboard role={role} />;
  if (page === 'resident') return <ResidentDashboard role={role} />;
  if (page === 'committee') return <CommitteeDashboard role={role} />;
  if (page === 'contractor') return <ContractorDashboard role={role} />;
  if (page === 'notices') return <NoticesPage role={role} />;
  if (page === 'maintenance') return <MaintenancePage role={role} />;
  if (page === 'work_orders') return <WorkOrdersPage role={role} />;
  if (page === 'projects') return <ProjectsPage role={role} />;
  if (page === 'assistant') return <AssistantPage role={role} />;

  const moduleMap: Record<PageId, { title: string; eyebrow: string; records: SimpleRecord[]; cta: string }> = {
    public: { title: '', eyebrow: '', records: [], cta: '' },
    portfolio: { title: '', eyebrow: '', records: [], cta: '' },
    buildings: { title: '', eyebrow: '', records: [], cta: '' },
    building: { title: '', eyebrow: '', records: [], cta: '' },
    resident: { title: '', eyebrow: '', records: [], cta: '' },
    committee: { title: '', eyebrow: '', records: [], cta: '' },
    contractor: { title: '', eyebrow: '', records: [], cta: '' },
    notices: { title: '', eyebrow: '', records: [], cta: '' },
    maintenance: { title: '', eyebrow: '', records: [], cta: '' },
    work_orders: { title: '', eyebrow: '', records: [], cta: '' },
    projects: { title: '', eyebrow: '', records: [], cta: '' },
    incidents: { title: 'Incident Register', eyebrow: 'Insurance, WHS and complaints', records: incidents, cta: 'Record incident' },
    compliance: { title: 'Compliance Dashboard', eyebrow: 'AFSS, lifts, insurance, WHS and Strata Hub', records: complianceItems, cta: 'Add compliance item' },
    documents: { title: 'Documents Library', eyebrow: 'Permissions, versions, search and downloads', records: documents, cta: 'Upload document' },
    levies: { title: 'Levy Tracking', eyebrow: 'Visibility now, accounting integrations later', records: levies, cta: 'Upload levy notice' },
    renovations: { title: 'Renovation Approvals', eyebrow: 'Resident requests, plans, committee review and by-law acknowledgements', records: renovations, cta: 'New renovation request' },
    meetings: { title: 'Meetings and AGMs', eyebrow: 'Agendas, motions, voting, minutes and reminders', records: meetings, cta: 'Create meeting' },
    facilities: { title: 'Facility Bookings', eyebrow: 'Rules, approvals, calendar and fee placeholders', records: facilityBookings, cta: 'Add booking' },
    packages: { title: 'Package Deliveries', eyebrow: 'Concierge logging and resident collection updates', records: packages, cta: 'Log package' },
    messages: { title: 'Messaging', eyebrow: 'Residents, committees, contractors and linked work contexts', records: messages, cta: 'New message' },
    assets: { title: 'Asset Register', eyebrow: 'Lifts, fire panels, gates, CCTV, pools and common systems', records: assets, cta: 'Add asset' },
    inspections: { title: 'Inspections', eyebrow: 'Checklists, photos, notes and maintenance conversion', records: inspections, cta: 'Schedule inspection' },
    notifications: { title: 'Notifications', eyebrow: 'In-app now, email/SMS/push placeholders ready', records: notifications, cta: 'Create notification' },
    settings: { title: 'Settings', eyebrow: 'Company, subscription, feature flags and integrations', records: company.featureFlags.map((flag, index) => ({ id: `ff${index}`, title: flag, buildingId: 'b1', owner: 'Platform', status: 'Enabled', meta: 'Feature flag' })), cta: 'Add feature flag' },
    users: { title: 'Users and Permissions', eyebrow: 'Company roles and building-level memberships', records: [...staff, ...committeeMembers.slice(0, 6)].map((person) => ({ id: person.id, title: person.name, buildingId: person.buildingId, owner: person.email, status: person.role, meta: person.unit })), cta: 'Invite user' },
    audit: { title: 'Audit Logs', eyebrow: 'User, role, action, entity, old/new value and tenant context', records: auditLogs, cta: 'Export logs' },
    assistant: { title: '', eyebrow: '', records: [], cta: '' }
  };

  const config = moduleMap[page];
  return <ModulePage {...config} records={filterForRole(config.records, role)} />;
}

function PortfolioDashboard({ role }: { role: Role }) {
  const scopedBuildings = role === 'manager' ? buildings.slice(0, 2) : buildings;
  const openMaintenance = filterForRole(maintenanceRequests, role).filter((request) => !['Completed', 'Closed', 'Rejected'].includes(request.status));
  const overdue = openMaintenance.filter((request) => request.overdue);
  const arrears = scopedBuildings.reduce((total, building) => total + building.arrears, 0);
  const spend = scopedBuildings.reduce((total, building) => total + building.maintenanceSpend, 0);

  return (
    <div className="space-y-6">
      <SectionHeader
        eyebrow={role === 'super_admin' ? 'Platform control centre' : 'Portfolio command'}
        title={role === 'super_admin' ? 'SaaS platform overview' : 'Northshore Strata Co. portfolio'}
        action={<button className="btn-primary"><UserPlus size={17} /> Invite staff</button>}
      />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Buildings" value={scopedBuildings.length.toString()} detail={`${scopedBuildings.reduce((total, building) => total + building.lots, 0)} lots`} icon={Building2} />
        <Metric title="Open maintenance" value={openMaintenance.length.toString()} detail={`${overdue.length} overdue`} icon={HammerIcon} tone="amber" />
        <Metric title="MRR placeholder" value={currency(company.mrr)} detail={`${company.plan} subscription`} icon={DollarSign} tone="green" />
        <Metric title="Compliance risk" value={`${complianceItems.filter((item) => item.status === 'Overdue').length} overdue`} detail="AFSS, insurance, lifts" icon={ShieldCheck} tone="red" />
      </div>
      <div className="grid gap-5 xl:grid-cols-[1.2fr_0.8fr]">
        <Panel title="Buildings needing attention" action={<button className="btn-secondary"><Filter size={16} /> Filter</button>}>
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
      </div>
    </div>
  );
}

function BuildingsPage({ role }: { role: Role }) {
  const scopedBuildings = role === 'manager' ? buildings.slice(0, 2) : buildings;
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Buildings" title="Managed schemes" action={<button className="btn-primary"><Plus size={17} /> Add building</button>} />
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
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Building dashboard" title={building.name} action={<button className="btn-primary"><Bell size={17} /> Create notice</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Lots" value={building.lots.toString()} detail={building.address} icon={Building2} />
        <Metric title="Open requests" value={buildingMaintenance.filter((item) => item.status !== 'Closed').length.toString()} detail="Maintenance and incidents" icon={AlertTriangle} tone="amber" />
        <Metric title="Active projects" value={projects.filter((project) => project.buildingId === building.id).length.toString()} detail="Committee visible" icon={Vote} tone="blue" />
        <Metric title="Levy arrears" value={currency(building.arrears)} detail="Owner visibility enabled" icon={DollarSign} tone="red" />
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
        <Panel title="Upcoming and active" className="xl:col-span-2">
          <RecordTable records={[...filterForRole(notices, role).slice(0, 3).map(noticeToRecord), ...buildingMaintenance.slice(0, 3).map(maintenanceToRecord)]} />
        </Panel>
      </div>
    </div>
  );
}

function ResidentDashboard({ role }: { role: Role }) {
  const feed = filterForRole(notices, role);
  const ownRequests = filterForRole(maintenanceRequests, role);
  return (
    <div className="mx-auto max-w-5xl space-y-5">
      <SectionHeader eyebrow="Resident home" title="Harbourline Residences" action={<button className="btn-primary"><Plus size={17} /> Submit request</button>} />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric title="Packages" value={packages.filter((item) => item.buildingId === 'b1' && item.status === 'Awaiting collection').length.toString()} detail="Awaiting collection" icon={Download} />
        <Metric title="Works" value={ownRequests.length.toString()} detail="Your building" icon={Clock3} tone="amber" />
        <Metric title="Meetings" value="1" detail="Next AGM" icon={CalendarDays} tone="blue" />
        <Metric title="Documents" value="Quick links" detail="By-laws, levies, minutes" icon={FileText} tone="green" />
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
            {['Book BBQ area', 'View levy notice', 'Message building manager', 'Submit incident report', 'Request renovation approval'].map((action) => (
              <button className="flex items-center justify-between rounded-2xl border border-line px-4 py-3 text-left hover:bg-slate-50" key={action}>
                <span className="font-medium">{action}</span>
                <ArrowRight size={17} />
              </button>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
}

function CommitteeDashboard({ role }: { role: Role }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Committee governance" title="Decisions, motions and financial oversight" action={<button className="btn-primary"><Vote size={17} /> Create motion</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Open motions" value={motions.length.toString()} detail="Votes and resolutions" icon={Vote} />
        <Metric title="Quotes awaiting approval" value="3" detail="Major works" icon={DollarSign} tone="amber" />
        <Metric title="Committee docs" value="12" detail="Restricted visibility" icon={FileText} tone="blue" />
        <Metric title="Capital works" value={currency(680000)} detail="Budget under review" icon={ShieldCheck} tone="green" />
      </div>
      <ModulePage title="Committee matters" eyebrow="Voting, expenditure approvals and digital resolutions" records={filterForRole([...motions, ...projects.map(projectToRecord), ...documents], role)} cta="Add committee item" compact />
    </div>
  );
}

function ContractorDashboard({ role }: { role: Role }) {
  const assigned = filterForRole(maintenanceRequests, role).filter((request) => request.contractorId);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Contractor portal" title="Assigned jobs and compliance" action={<button className="btn-primary"><Download size={17} /> Upload invoice</button>} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <Metric title="Assigned jobs" value={assigned.length.toString()} detail="Across permitted buildings" icon={Clock3} />
        <Metric title="In progress" value={assigned.filter((item) => item.status === 'In Progress').length.toString()} detail="Roster today" icon={CheckCircle2} tone="blue" />
        <Metric title="Quotes requested" value="2" detail="Upload quote PDFs" icon={FileText} tone="amber" />
        <Metric title="Insurance expiry" value="17 days" detail="Reminder active" icon={ShieldCheck} tone="red" />
      </div>
      <MaintenanceCards requests={assigned} contractorView />
    </div>
  );
}

function NoticesPage({ role }: { role: Role }) {
  const scoped = filterForRole(notices, role);
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Resident feed and notices" title="Targeted building communications" action={<button className="btn-primary"><Plus size={17} /> Create notice</button>} />
      <div className="grid gap-4 lg:grid-cols-3">
        {scoped.map((notice) => (
          <article className="rounded-3xl border border-line bg-white p-5 shadow-soft" key={notice.id}>
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
        ))}
      </div>
    </div>
  );
}

function MaintenancePage({ role }: { role: Role }) {
  return (
    <div className="space-y-6">
      <SectionHeader eyebrow="Maintenance requests" title="Triage, quotes, work orders and SLA timers" action={<button className="btn-primary"><Plus size={17} /> New request</button>} />
      <MaintenanceCards requests={filterForRole(maintenanceRequests, role)} />
    </div>
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
      <SectionHeader eyebrow="Major projects" title="Capital works and resident updates" action={<button className="btn-primary"><Plus size={17} /> New project</button>} />
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

function AssistantPage({ role }: { role: Role }) {
  const [message, setMessage] = useState('When is the next AGM?');
  const scopedMeetings = filterForRole(meetings, role);
  const response = message.toLowerCase().includes('agm')
    ? `The next AGM is ${scopedMeetings[0]?.due ?? 'not scheduled yet'} for ${buildingName(scopedMeetings[0]?.buildingId ?? 'b1')}.`
    : message.toLowerCase().includes('bbq')
      ? 'The BBQ area can be booked from the Facilities page. Manager approval and deposit placeholders are enabled.'
      : message.toLowerCase().includes('lift')
        ? 'Lift repair updates are pulled from notices, maintenance requests and projects in the future RAG integration.'
        : 'I can answer from notices, documents, projects, meetings, maintenance updates and facility rules once the AI/RAG layer is connected.';

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <SectionHeader eyebrow="AI assistant placeholder" title="Resident and manager knowledge assistant" action={<span className="pill bg-blue-50 text-blue-700 ring-blue-200">Future RAG integration</span>} />
      <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
        <Panel title="Suggested questions">
          <div className="grid gap-2">
            {['When is the next AGM?', 'Can I book the BBQ area?', 'What is happening with the lift repair?', 'Where are the by-laws?', 'When is the water shutdown?'].map((question) => (
              <button className="rounded-2xl border border-line px-4 py-3 text-left text-sm hover:bg-slate-50" key={question} onClick={() => setMessage(question)}>
                {question}
              </button>
            ))}
          </div>
        </Panel>
        <Panel title="Chat">
          <div className="min-h-80 rounded-3xl bg-slate-50 p-4">
            <div className="ml-auto max-w-[80%] rounded-3xl bg-ink px-4 py-3 text-sm text-white">{message}</div>
            <div className="mt-4 flex max-w-[86%] gap-3">
              <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white text-harbour shadow-sm"><Bot size={18} /></span>
              <div className="rounded-3xl border border-line bg-white px-4 py-3 text-sm leading-6 text-slate-700">{response}</div>
            </div>
          </div>
          <div className="mt-4 flex gap-2">
            <input className="flex-1 rounded-2xl border border-line px-4 py-3 outline-none focus:border-harbour" value={message} onChange={(event) => setMessage(event.target.value)} />
            <button className="icon-button bg-ink text-white" aria-label="Send message"><Send size={18} /></button>
          </div>
          <p className="mt-3 text-xs text-slate-500">TODO: connect Supabase pgvector/OpenAI retrieval over notices, documents, projects, meetings, maintenance and facility rules.</p>
        </Panel>
      </div>
    </div>
  );
}

function ModulePage({ title, eyebrow, records, cta, compact = false }: { title: string; eyebrow: string; records: SimpleRecord[]; cta: string; compact?: boolean }) {
  return (
    <div className={compact ? 'space-y-4' : 'space-y-6'}>
      {!compact && <SectionHeader eyebrow={eyebrow} title={title} action={<button className="btn-primary"><Plus size={17} /> {cta}</button>} />}
      <Panel title={compact ? title : 'Records'} action={!compact ? <button className="btn-secondary"><Download size={16} /> Export</button> : undefined}>
        {records.length ? <RecordTable records={records} /> : <EmptyState title="Nothing needs attention" copy="New activity will appear here once residents, managers or contractors create records." />}
      </Panel>
      {!compact && title === 'Notifications' && <p className="text-xs text-slate-500">TODO: wire email, SMS and push providers after in-app notification events are finalised.</p>}
      {!compact && title === 'Levy Tracking' && <p className="text-xs text-slate-500">TODO: connect accounting, payment and bank reconciliation integrations when processing is enabled.</p>}
    </div>
  );
}

function MaintenanceCards({ requests, contractorView = false }: { requests: MaintenanceRequest[]; contractorView?: boolean }) {
  return (
    <div className="grid gap-4 lg:grid-cols-2">
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
            <button className="btn-secondary"><Eye size={16} /> View trail</button>
            <button className="btn-secondary"><MessageSquare size={16} /> Update</button>
            {!contractorView && <button className="btn-secondary">Assign</button>}
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

function SectionHeader({ eyebrow, title, action }: { eyebrow: string; title: string; action?: React.ReactNode }) {
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

function Panel({ title, action, children, className = '' }: { title: string; action?: React.ReactNode; children: React.ReactNode; className?: string }) {
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

function Metric({ title, value, detail, icon: Icon, tone = 'navy' }: { title: string; value: string; detail: string; icon: React.ElementType; tone?: 'navy' | 'amber' | 'green' | 'red' | 'blue' }) {
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

function HammerIcon(props: React.ComponentProps<typeof AlertTriangle>) {
  return <AlertTriangle {...props} />;
}

export default App;
