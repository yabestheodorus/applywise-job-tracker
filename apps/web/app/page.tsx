import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import {
  ArrowRight,
  CalendarClock,
  ClipboardPaste,
  Dumbbell,
  FileText,
  LayoutGrid,
  MessagesSquare,
  ScanSearch,
  Sparkles,
  Target,
  type LucideIcon,
} from 'lucide-react';
import { FaLinkedin, FaWhatsapp } from 'react-icons/fa6';
import { HiOutlineMail } from 'react-icons/hi';

import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'ApplyWise — Track your job hunt without the busywork',
  description:
    'Paste a recruiter message and let AI track the rest: structured applications, status updates, deadlines, skill matching, and AI interview prep — all in one board.',
};

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const authed = !!user;

  return (
    <div className="bg-background text-foreground min-h-screen">
      <SiteNav authed={authed} />
      <Hero authed={authed} />
      <SourcesStrip />
      <Problem />
      <Features />
      <InterviewSpotlight authed={authed} />
      <HowItWorks />
      <Differentiator />
      <FinalCta authed={authed} />
      <SiteFooter />
    </div>
  );
}

/** CTA target + label that adapts to whether the visitor is signed in. */
const cta = (authed: boolean) =>
  authed
    ? { href: '/board', label: 'Go to your board' }
    : { href: '/signup', label: 'Start tracking free' };

/* ----------------------------------------------------------------- Nav */

function SiteNav({ authed }: { authed: boolean }) {
  return (
    <header className="bg-background/80 sticky top-0 z-20 border-b backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Image
          src="/logo.png"
          alt="ApplyWise"
          width={850}
          height={208}
          priority
          className="h-7 w-auto dark:brightness-0 dark:invert"
        />
        <nav className="flex items-center gap-2">
          {authed ? (
            <Link
              href="/board"
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
            >
              Go to your board
              <ArrowRight className="size-4" />
            </Link>
          ) : (
            <>
              <Link
                href="/login"
                className="text-muted-foreground hover:text-foreground rounded-lg px-4 py-2 text-sm font-medium transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium shadow-sm transition-colors"
              >
                Get started
                <ArrowRight className="size-4" />
              </Link>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}

/* ---------------------------------------------------------------- Hero */

function Hero({ authed }: { authed: boolean }) {
  const primary = cta(authed);
  return (
    <section className="relative overflow-hidden">
      <div className="from-primary/10 pointer-events-none absolute inset-0 bg-linear-to-b via-transparent to-transparent" />
      <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div>
          <span className="border-primary/20 bg-primary/10 text-primary mb-5 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <Sparkles className="size-3.5" />
            AI-assisted, paste-to-track
          </span>
          <h1 className="font-heading text-4xl leading-[1.1] tracking-tight sm:text-5xl">
            Stop losing track of your job hunt.
          </h1>
          <p className="text-muted-foreground mt-5 max-w-xl text-lg leading-relaxed">
            Your applications are scattered across WhatsApp, email, Glints, and
            LinkedIn. Paste the messages into ApplyWise and AI does the rest —
            structured cards, status updates, deadlines, and interview prep, all
            on one board.
          </p>
          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Link
              href={primary.href}
              className="bg-primary text-primary-foreground hover:bg-primary/90 inline-flex items-center gap-2 rounded-xl px-5 py-3 text-sm font-semibold shadow-sm transition-colors"
            >
              {primary.label}
              <ArrowRight className="size-4" />
            </Link>
            <Link
              href="#features"
              className="border-input hover:bg-muted inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold transition-colors"
            >
              See how it works
            </Link>
          </div>
          <p className="text-muted-foreground mt-4 text-xs">
            No spreadsheets. No manual data entry. Just paste and go.
          </p>
        </div>

        <BoardPreview />
      </div>
    </section>
  );
}

/** A lightweight, decorative mock of the product to show what it looks like. */
function BoardPreview() {
  return (
    <div className="bg-card relative rounded-2xl border p-4 shadow-xl lg:p-5">
      <div className="mb-3 flex items-center justify-between">
        <p className="font-heading text-sm">Your applications</p>
        <span className="bg-primary/10 text-primary rounded-md px-2 py-0.5 text-[11px] font-medium">
          12 active
        </span>
      </div>

      <div className="flex flex-col gap-3">
        <PreviewLane color="#8b5cf6" label="Screening" count={3}>
          <PreviewCard
            company="Stripe"
            role="Senior Engineer"
            matched={5}
            gap={1}
          />
        </PreviewLane>
        <PreviewLane color="#0ea5e9" label="Interview" count={2}>
          <PreviewCard company="Vercel" role="Product Engineer" matched={6} gap={2} />
        </PreviewLane>
      </div>

      <div className="border-primary/20 bg-primary/5 mt-3 flex items-center gap-2 rounded-lg border px-3 py-2">
        <CalendarClock className="text-primary size-4 shrink-0" />
        <p className="text-xs">
          <span className="font-medium">Technical interview</span> · Stripe ·
          tomorrow 14:00
        </p>
      </div>
    </div>
  );
}

function PreviewLane({
  color,
  label,
  count,
  children,
}: {
  color: string;
  label: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <div
      className="bg-muted/50 rounded-xl border border-l-[3px] p-2.5"
      style={{ borderLeftColor: color }}
    >
      <div className="mb-2 flex items-center gap-2 px-0.5">
        <span className="size-2 rounded-full" style={{ backgroundColor: color }} />
        <span className="text-xs font-medium">{label}</span>
        <span className="text-muted-foreground text-[11px] tabular-nums">
          {count}
        </span>
      </div>
      {children}
    </div>
  );
}

function PreviewCard({
  company,
  role,
  matched,
  gap,
}: {
  company: string;
  role: string;
  matched: number;
  gap: number;
}) {
  return (
    <div className="bg-card rounded-lg border p-3 shadow-sm">
      <p className="text-sm font-semibold">{company}</p>
      <p className="text-muted-foreground text-xs">{role}</p>
      <div className="mt-2 flex gap-1.5">
        <span className="rounded-full bg-emerald-50 px-2 py-0.5 text-[11px] font-medium text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
          {matched} matched
        </span>
        <span className="rounded-full bg-rose-50 px-2 py-0.5 text-[11px] font-medium text-rose-700 dark:bg-rose-950 dark:text-rose-300">
          {gap} gap
        </span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------- Sources */

function SourcesStrip() {
  const sources: {
    Icon: React.ComponentType<{ className?: string }>;
    label: string;
  }[] = [
    { Icon: FaWhatsapp, label: 'WhatsApp' },
    { Icon: HiOutlineMail, label: 'Email' },
    { Icon: FaLinkedin, label: 'LinkedIn' },
  ];
  return (
    <section className="border-y">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-8 gap-y-3 px-6 py-6 text-sm">
        <span className="font-medium">Pulls structure from anywhere you apply:</span>
        {sources.map(({ Icon, label }) => (
          <span key={label} className="inline-flex items-center gap-1.5">
            <Icon className="size-4" />
            {label}
          </span>
        ))}
        <span className="inline-flex items-center gap-1.5">Glints · JobStreet · & more</span>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Problem */

function Problem() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
        Job hunting is a tracking nightmare
      </h2>
      <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
        Three active applications. Twenty “viewed”. Ten asking you to fill a form.
        Five assessments due. Three interviews to prep. The one question that
        matters — <em>which company, and do I prep an interview or finish an
        assessment first?</em> — means scrolling back through emails and job
        boards just to dig out one fact.
      </p>
      <p className="mt-6 text-lg font-medium">
        ApplyWise keeps that one fact in one place.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------ Features */

const FEATURES: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: ClipboardPaste,
    title: 'Paste, don’t type',
    desc: 'Drop in a recruiter chat, email, or job posting. AI extracts the company, role, requirements, salary, and deadline into a clean card.',
  },
  {
    icon: LayoutGrid,
    title: 'A board that updates itself',
    desc: 'Paste a status email and AI moves the application to the right stage and logs a timeline entry — in your language, English or Indonesian.',
  },
  {
    icon: CalendarClock,
    title: 'Never miss a deadline',
    desc: 'When an update mentions a date, it’s auto-captured as an event. The Upcoming agenda shows every interview and deadline, soonest first.',
  },
  {
    icon: ScanSearch,
    title: 'Know your fit instantly',
    desc: 'Upload your CV once. Every application shows your matched skills and gaps against what the job asks for — your strengths and weak spots at a glance.',
  },
  {
    icon: FileText,
    title: 'Answer once, reuse forever',
    desc: 'Build a library of reusable answers to the questions every form repeats — “why this company”, salary, notice period. Copy them in with one click.',
  },
  {
    icon: Dumbbell,
    title: 'Walk in interview-ready',
    desc: 'Generate likely questions for a specific role, rehearse with AI coaching, run a live mock, and drill the key points until they’re loaded.',
  },
];

function Features() {
  return (
    <section id="features" className="bg-muted/30 border-y">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
            Everything your job search needs, in one place
          </h2>
          <p className="text-muted-foreground mt-4 text-lg">
            The tracking is a side effect of forwarding a message — not a second
            job.
          </p>
        </div>
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card flex flex-col gap-3 rounded-xl border p-6 shadow-sm"
            >
              <span className="bg-primary/10 text-primary flex size-10 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </span>
              <h3 className="font-heading text-lg">{title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------- Interview spotlight */

const PREP_STEPS: { icon: LucideIcon; title: string; desc: string }[] = [
  {
    icon: Target,
    title: 'Tailored questions',
    desc: 'AI generates the questions this role will likely ask — behavioral, technical, and pointed ones about your skill gaps.',
  },
  {
    icon: Sparkles,
    title: 'Coached answers',
    desc: 'Answer in your own words, get scored feedback and a stronger version, then save the best ones to your library.',
  },
  {
    icon: MessagesSquare,
    title: 'Live mock + drill',
    desc: 'Run a back-and-forth mock interview with follow-ups, get a debrief, then drill the key points like flashcards.',
  },
];

function InterviewSpotlight({ authed }: { authed: boolean }) {
  return (
    <section className="mx-auto max-w-6xl px-6 py-20">
      <div className="grid items-center gap-12 lg:grid-cols-2">
        <div>
          <span className="border-primary/20 bg-primary/10 text-primary mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-medium">
            <Dumbbell className="size-3.5" />
            Interview Training Session
          </span>
          <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
            Don’t just track the interview. Walk in with loaded answers.
          </h2>
          <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
            Most trackers stop at “Interview — Thursday”. ApplyWise turns that into
            active prep tied to the exact role: rehearse, get coached, run a live
            mock, and commit your best answers to memory — so you’re not reading
            notes, you’re recalling them.
          </p>
          <Link
            href={authed ? '/board' : '/signup'}
            className="text-primary mt-6 inline-flex items-center gap-1.5 text-sm font-semibold hover:underline"
          >
            {authed ? 'Open your board' : 'Try interview prep'}
            <ArrowRight className="size-4" />
          </Link>
        </div>

        <div className="flex flex-col gap-3">
          {PREP_STEPS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="bg-card flex items-start gap-4 rounded-xl border p-5 shadow-sm"
            >
              <span className="bg-primary/10 text-primary flex size-10 shrink-0 items-center justify-center rounded-lg">
                <Icon className="size-5" />
              </span>
              <div>
                <h3 className="font-medium">{title}</h3>
                <p className="text-muted-foreground mt-0.5 text-sm leading-relaxed">
                  {desc}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------------- How it works */

const STEPS: { n: string; title: string; desc: string }[] = [
  {
    n: '1',
    title: 'Paste a message',
    desc: 'A WhatsApp chat, a recruiter email, a job posting — whatever you’ve got.',
  },
  {
    n: '2',
    title: 'Review the AI draft',
    desc: 'AI fills in the details. You glance, tweak anything, and confirm — nothing is saved without you.',
  },
  {
    n: '3',
    title: 'Track and prep',
    desc: 'It lands on your board. Update its status by pasting, watch deadlines, and prep for the interview.',
  },
];

function HowItWorks() {
  return (
    <section className="bg-muted/30 border-y">
      <div className="mx-auto max-w-6xl px-6 py-20">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
            From messy message to tracked in seconds
          </h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, title, desc }) => (
            <div key={n} className="relative">
              <span className="bg-primary text-primary-foreground font-heading flex size-10 items-center justify-center rounded-full text-lg shadow-sm">
                {n}
              </span>
              <h3 className="font-heading mt-4 text-lg">{title}</h3>
              <p className="text-muted-foreground mt-1.5 text-sm leading-relaxed">
                {desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/* --------------------------------------------------- Differentiator */

function Differentiator() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-20 text-center">
      <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
        Spreadsheets make you do the work. ApplyWise does it for you.
      </h2>
      <p className="text-muted-foreground mx-auto mt-4 max-w-2xl text-lg leading-relaxed">
        Notion templates, Trello boards, and paid trackers all leave the data
        entry and status updates to you. ApplyWise leans on AI to read the messy
        text you already receive — so staying organized takes a paste, not a
        habit you have to maintain.
      </p>
    </section>
  );
}

/* --------------------------------------------------------------- CTA */

function FinalCta({ authed }: { authed: boolean }) {
  const primary = cta(authed);
  return (
    <section className="px-6 pb-24">
      <div className="from-primary/15 mx-auto max-w-5xl rounded-3xl border bg-linear-to-br via-transparent to-transparent p-10 text-center sm:p-16">
        <h2 className="font-heading text-3xl tracking-tight sm:text-4xl">
          Take control of your job search
        </h2>
        <p className="text-muted-foreground mx-auto mt-4 max-w-xl text-lg">
          One board for every application — captured by AI, prepped for the
          interview. Get started in under a minute.
        </p>
        <Link
          href={primary.href}
          className="bg-primary text-primary-foreground hover:bg-primary/90 mt-8 inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold shadow-sm transition-colors"
        >
          {primary.label}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------- Footer */

function SiteFooter() {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 text-sm sm:flex-row">
        <Image
          src="/logo.png"
          alt="ApplyWise"
          width={850}
          height={208}
          className="h-6 w-auto opacity-80 dark:brightness-0 dark:invert"
        />
        <div className="flex items-center gap-5">
          <Link href="/login" className="hover:text-foreground">
            Log in
          </Link>
          <Link href="/signup" className="hover:text-foreground">
            Get started
          </Link>
        </div>
        <p>© {new Date().getFullYear()} ApplyWise</p>
      </div>
    </footer>
  );
}
