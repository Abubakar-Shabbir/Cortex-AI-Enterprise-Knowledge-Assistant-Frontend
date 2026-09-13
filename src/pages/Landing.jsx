import { useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  ArrowRightIcon as ArrowRight,
  ChartLineUpIcon as ChartLineUp,
  ChatCircleIcon as ChatCircle,
  ClipboardTextIcon as ClipboardText,
  FilesIcon as Files,
  FingerprintIcon as Fingerprint,
  GraphIcon as Graph,
  LockIcon as Lock,
  ShieldCheckIcon as ShieldCheck,
  UsersThreeIcon as UsersThree,
} from '@phosphor-icons/react';
import SiteHeader from '../components/SiteHeader';
import SiteFooter from '../components/SiteFooter';

const FEATURES = [
  {
    icon: ChatCircle,
    title: 'Ask AI, grounded in your docs',
    body: 'Ask questions in plain language and get answers cited back to the exact source chunk — anything filled in from general knowledge is clearly marked as such.',
  },
  {
    icon: Graph,
    title: 'Knowledge graph',
    body: 'Entities and relationships are extracted automatically as you upload, so you can explore how people, terms, and documents connect.',
  },
  {
    icon: Files,
    title: 'Document management',
    body: 'Upload, organize into collections, and share across your organization’s library with full version and access history.',
  },
  {
    icon: ChartLineUp,
    title: 'Analytics & reports',
    body: 'Track usage, query volume, and answer quality over time, then export reports for stakeholders.',
  },
  {
    icon: UsersThree,
    title: 'Organizations & roles',
    body: 'Multi-tenant by design: invite teammates, group them into organizations, and scope access with fine-grained role-based permissions.',
  },
  {
    icon: ShieldCheck,
    title: 'Security & audit',
    body: 'Every sensitive action is logged to an audit trail, with encryption in transit and at rest across the platform.',
  },
];

const STEPS = [
  {
    icon: UsersThree,
    title: 'Create your workspace',
    body: 'Sign up your company in minutes — you land on a working Free plan immediately, no credit card required.',
  },
  {
    icon: Files,
    title: 'Upload your documents',
    body: 'Drop in PDFs, spreadsheets, and files from your existing tools — Cortex chunks, embeds, and extracts a knowledge graph automatically.',
  },
  {
    icon: ChatCircle,
    title: 'Ask anything',
    body: 'Query in natural language, get a cited answer, or jump into the graph to explore how everything relates.',
  },
];

const TRUST = [
  { icon: UsersThree, label: 'Org-based isolation' },
  { icon: Fingerprint, label: 'Role-based access' },
  { icon: ClipboardText, label: 'Full audit trail' },
  { icon: Lock, label: 'Encrypted in transit & at rest' },
];

export default function Landing() {
  const location = useLocation();

  useEffect(() => {
    document.title = 'Cortex · Enterprise Knowledge Assistant';
  }, []);

  // A visitor arriving at "/#features" from a different route (the
  // Guide page's navbar/footer, say) lands on "/" with the hash
  // already in the URL - React Router doesn't auto-scroll to it the
  // way a full page navigation would, so do it once here.
  useEffect(() => {
    if (!location.hash) return;
    const el = document.querySelector(location.hash);
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  return (
    <div className="min-h-screen bg-surface text-ink dark:bg-surface-dark dark:text-ink-dark">
      <SiteHeader />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="pointer-events-none absolute right-[-10%] top-[-10%] h-96 w-96 rounded-full bg-primary/[0.06] blur-3xl dark:bg-primary/[0.12]" aria-hidden="true"></div>
        <div className="pointer-events-none absolute left-[-8%] top-40 h-80 w-80 rounded-full bg-accent/[0.05] blur-3xl dark:bg-accent/[0.1]" aria-hidden="true"></div>

        <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-20 text-center sm:pb-28 sm:pt-28">
          <div className="fade-in-up mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-line bg-card px-3.5 py-1.5 text-xs font-medium text-muted dark:border-line-dark dark:bg-card-dark dark:text-muted-dark">
            <span className="relative flex h-1.5 w-1.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success/60 dark:bg-success-dark/60"></span>
              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-success dark:bg-success-dark"></span>
            </span>
            Enterprise knowledge assistant
          </div>

          <h1 className="fade-in-up mx-auto max-w-3xl text-4xl font-extrabold leading-[1.1] tracking-tight text-ink sm:text-5xl md:text-6xl dark:text-ink-dark">
            Answers grounded in your own documents
          </h1>
          <p className="fade-in-up mx-auto mt-5 max-w-2xl text-base leading-relaxed text-muted sm:text-lg dark:text-muted-dark">
            Cortex reads what your team uploads, cites where every answer came from, and maps how your information connects — so nobody has to dig through folders to find what they already know.
          </p>

          <div className="fade-in-up mt-9 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              to="/signup"
              className="btn-sheen flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-semibold text-white shadow-softer transition-all hover:bg-primary-dark active:scale-[0.98] sm:w-auto"
            >
              Get started free <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              to="/guide"
              className="flex w-full items-center justify-center gap-2 rounded-lg border border-line bg-card px-6 py-3 text-sm font-semibold text-ink transition-colors hover:bg-surface sm:w-auto dark:border-line-dark dark:bg-card-dark dark:text-ink-dark dark:hover:bg-white/5"
            >
              See the step-by-step guide
            </Link>
          </div>

          {/* Abstract product visual */}
          <div className="fade-in-up relative mx-auto mt-16 max-w-3xl">
            <div className="overflow-hidden rounded-2xl border border-line bg-card shadow-soft dark:border-line-dark dark:bg-card-dark">
              <div className="flex items-center gap-1.5 border-b border-line px-4 py-3 dark:border-line-dark">
                <span className="h-2.5 w-2.5 rounded-full bg-danger/40"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-warning/40"></span>
                <span className="h-2.5 w-2.5 rounded-full bg-success/40"></span>
                <span className="ml-3 text-xs font-medium text-muted dark:text-muted-dark">Ask AI</span>
              </div>
              <div className="grid grid-cols-1 gap-0 sm:grid-cols-5">
                <div className="space-y-3 border-b border-line p-5 text-left sm:col-span-3 sm:border-b-0 sm:border-r dark:border-line-dark">
                  <div className="ml-auto max-w-[85%] rounded-lg rounded-tr-sm bg-primary/10 px-3.5 py-2.5 text-sm text-ink dark:bg-primary/15 dark:text-ink-dark">
                    What changed in our vendor contract renewal terms this year?
                  </div>
                  <div className="max-w-[90%] space-y-2 rounded-lg rounded-tl-sm border border-line bg-surface px-3.5 py-2.5 text-sm text-ink dark:border-line-dark dark:bg-white/5 dark:text-ink-dark">
                    <p>The renewal window shortened from 90 to 60 days and auto-renewal now requires written opt-in.</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      <span className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-muted dark:border-line-dark dark:text-muted-dark">Vendor_Agreement_2026.pdf · p.4</span>
                      <span className="rounded-md border border-line px-2 py-0.5 text-[11px] font-medium text-muted dark:border-line-dark dark:text-muted-dark">Amendment_03.pdf · p.1</span>
                    </div>
                  </div>
                </div>
                <div className="space-y-3 p-5 text-left sm:col-span-2">
                  <p className="text-xs font-semibold uppercase tracking-wide text-muted dark:text-muted-dark">Connected entities</p>
                  {['Vendor Agreement', 'Renewal Clause', 'Legal Team'].map((n) => (
                    <div key={n} className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 dark:border-line-dark">
                      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-primary"></span>
                      <span className="text-xs font-medium text-ink dark:text-ink-dark">{n}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capability strip */}
      <section className="border-y border-line bg-card dark:border-line-dark dark:bg-card-dark">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-6 py-10 sm:grid-cols-4">
          {TRUST.map(({ icon: Icon, label }) => (
            <div key={label} className="flex flex-col items-center gap-2 text-center sm:flex-row sm:text-left">
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:text-primary-soft">
                <Icon className="h-4 w-4" />
              </span>
              <span className="text-xs font-semibold leading-snug text-ink dark:text-ink-dark">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-24">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary dark:text-primary-soft">Features</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-ink-dark">Everything your team needs to work with documents at scale</h2>
          <p className="mt-4 text-base leading-relaxed text-muted dark:text-muted-dark">One workspace for uploading, understanding, and querying every document your organization owns.</p>
        </div>

        <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, body }) => (
            <div key={title} className="group rounded-2xl border border-line bg-card p-6 transition-shadow duration-200 hover:shadow-soft dark:border-line-dark dark:bg-card-dark">
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-soft">
                <Icon className="h-5 w-5" weight="bold" />
              </div>
              <h3 className="text-base font-semibold text-ink dark:text-ink-dark">{title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-muted dark:text-muted-dark">{body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="border-y border-line bg-card dark:border-line-dark dark:bg-card-dark">
        <div className="mx-auto max-w-6xl px-6 py-24">
          <div className="mx-auto max-w-2xl text-center">
            <p className="text-xs font-semibold uppercase tracking-wide text-primary dark:text-primary-soft">How it works</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-ink-dark">From raw files to grounded answers in three steps</h2>
          </div>

          <div className="mt-14 grid grid-cols-1 gap-10 sm:grid-cols-3">
            {STEPS.map(({ icon: Icon, title, body }, i) => (
              <div key={title} className="relative text-center sm:text-left">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary text-white sm:mx-0">
                  <Icon className="h-5 w-5" weight="bold" />
                </div>
                <p className="mt-4 text-xs font-bold uppercase tracking-wide text-primary dark:text-primary-soft">Step {i + 1}</p>
                <h3 className="mt-1 text-lg font-semibold text-ink dark:text-ink-dark">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted dark:text-muted-dark">{body}</p>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link to="/guide" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline dark:text-primary-soft">
              Walk through the full, detailed guide <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="mx-auto max-w-6xl px-6 py-24">
        <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-primary dark:text-primary-soft">Security</p>
            <h2 className="mt-2 text-3xl font-bold tracking-tight text-ink sm:text-4xl dark:text-ink-dark">Built for enterprise access control from day one</h2>
            <p className="mt-4 text-base leading-relaxed text-muted dark:text-muted-dark">
              Every organization is isolated by design. Roles and permissions govern exactly who can see, edit, or administer what, and every sensitive action is written to an audit log your admins can review.
            </p>
            <ul className="mt-6 space-y-3">
              {['Multi-tenant organizations with strict data isolation', 'Fine-grained, role-based permissions per feature area', 'Full audit trail across users, documents, and settings', 'Encryption in transit and at rest'].map((t) => (
                <li key={t} className="flex items-start gap-2.5 text-sm text-ink dark:text-ink-dark">
                  <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-success dark:text-success-dark" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          <div className="rounded-2xl border border-line bg-card p-8 dark:border-line-dark dark:bg-card-dark">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-primary-soft">
              <Lock className="h-5 w-5" weight="bold" />
            </div>
            <p className="mt-5 text-sm font-semibold text-ink dark:text-ink-dark">Access, scoped correctly by default</p>
            <div className="mt-4 space-y-2.5">
              {[
                { role: 'Company owner', access: 'Full access' },
                { role: 'Admin', access: 'Manage org & users' },
                { role: 'Member', access: 'Scoped to assigned docs' },
              ].map((r) => (
                <div key={r.role} className="flex items-center justify-between rounded-lg border border-line bg-surface px-3.5 py-2.5 text-sm dark:border-line-dark dark:bg-white/5">
                  <span className="font-medium text-ink dark:text-ink-dark">{r.role}</span>
                  <span className="text-xs text-muted dark:text-muted-dark">{r.access}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-6xl px-6 pb-24">
        <div className="relative overflow-hidden rounded-2xl bg-primary px-8 py-14 text-center dark:bg-primary-dark">
          <div className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-white/10 blur-3xl" aria-hidden="true"></div>
          <div className="pointer-events-none absolute -bottom-20 -left-10 h-56 w-56 rounded-full bg-black/10 blur-3xl" aria-hidden="true"></div>
          <h2 className="relative text-3xl font-bold tracking-tight text-white sm:text-4xl">Ready to get grounded answers from your own documents?</h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sm text-white/80 sm:text-base">Create your organization's workspace in minutes — no credit card required.</p>
          <div className="relative mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link to="/signup" className="flex w-full items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-semibold text-primary transition-transform active:scale-[0.98] sm:w-auto">
              Create your account <ArrowRight className="h-4 w-4" />
            </Link>
            <Link to="/login" className="w-full rounded-lg border border-white/30 px-6 py-3 text-center text-sm font-semibold text-white transition-colors hover:bg-white/10 sm:w-auto">
              Log in
            </Link>
          </div>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
