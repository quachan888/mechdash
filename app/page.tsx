import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import {
  ArrowRight,
  BarChart3,
  CalendarClock,
  CheckCircle2,
  FileUp,
  Gauge,
  Search,
  ShieldCheck,
  Wallet,
  Wrench,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

export const dynamic = 'force-dynamic';

const workflow = [
  {
    title: 'Export from Tekmetric',
    description: 'Bring over your repair order CSV at the end of the day or pay period.',
    icon: FileUp,
  },
  {
    title: 'Review every RO',
    description: 'Search jobs, vehicles, customers, hours, and completed work from one clean records table.',
    icon: Search,
  },
  {
    title: 'Check your paycheck',
    description: 'Compare billed hours and earned pay against what landed on your check.',
    icon: Wallet,
  },
];

const features = [
  'Hourly rates use effective date ranges',
  'Earned pay updates automatically by RO date',
  'Dashboard shows hours, makes, jobs, and trends',
  'Backup and restore your mechanic history',
];

export default async function Home() {
  const session = await getServerSession(authOptions);
  if (session) {
    redirect('/dashboard');
  }

  return (
    <main className="min-h-screen bg-[#f7f9fb] text-slate-950">
      <section className="relative overflow-hidden bg-[#17212f] text-white">
        <div className="absolute inset-0 opacity-25">
          <div className="h-full w-full bg-[linear-gradient(120deg,rgba(245,158,11,0.34)_0%,rgba(14,165,233,0.16)_38%,rgba(23,33,47,0)_72%)]" />
        </div>
        <div className="absolute inset-x-0 bottom-0 h-24 bg-[#f7f9fb]" />

        <div className="relative mx-auto flex min-h-[92vh] max-w-7xl flex-col px-5 py-5 sm:px-8 lg:px-10">
          <header className="flex items-center justify-between">
            <Link href="/" className="flex items-center gap-2 font-bold tracking-wide">
              <span className="flex h-10 w-10 items-center justify-center rounded bg-amber-500 text-slate-950">
                <Wrench className="h-5 w-5" />
              </span>
              <span className="text-xl">MechDash</span>
            </Link>

            <nav className="flex items-center gap-2">
              <Button asChild variant="ghost" className="text-white hover:bg-white/10 hover:text-white">
                <Link href="/login">Sign in</Link>
              </Button>
              <Button asChild className="bg-amber-500 text-slate-950 hover:bg-amber-400">
                <Link href="/signup">Create account</Link>
              </Button>
            </nav>
          </header>

          <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1fr_0.95fr] lg:py-8">
            <div className="max-w-3xl">
              <div className="mb-5 inline-flex items-center gap-2 rounded border border-white/15 bg-white/10 px-3 py-2 text-sm text-slate-100">
                <Gauge className="h-4 w-4 text-amber-300" />
                Built for flat-rate and hourly automotive mechanics
              </div>

              <h1 className="max-w-4xl text-5xl font-black leading-[1.02] tracking-normal sm:text-6xl lg:text-7xl">
                Turn Tekmetric exports into your own paycheck dashboard.
              </h1>

              <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-200 sm:text-xl">
                Upload your repair order CSV, see what you worked on, track billed hours, and verify earned pay against the rate that was active on each RO date.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Button asChild size="lg" className="h-12 bg-amber-500 px-6 text-base font-bold text-slate-950 hover:bg-amber-400">
                  <Link href="/signup">
                    Start tracking now
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild size="lg" variant="outline" className="h-12 border-white/25 bg-white/5 px-6 text-base text-white hover:bg-white/10 hover:text-white">
                  <Link href="/login">I already have an account</Link>
                </Button>
              </div>

              <div className="mt-9 grid max-w-2xl grid-cols-2 gap-3 text-sm text-slate-200 sm:grid-cols-4">
                <div>
                  <div className="text-2xl font-black text-white">CSV</div>
                  <div>Tekmetric import</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">RO</div>
                  <div>Job line detail</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">$</div>
                  <div>Rate-based earned pay</div>
                </div>
                <div>
                  <div className="text-2xl font-black text-white">Pay</div>
                  <div>Paycheck review</div>
                </div>
              </div>
            </div>

            <div className="relative pb-10 lg:pb-0">
              <div className="relative mx-auto max-w-xl rounded border border-white/10 bg-white p-3 text-slate-950 shadow-2xl">
                <div className="flex items-center justify-between border-b border-slate-200 px-3 py-3">
                  <div>
                    <div className="text-sm font-bold text-slate-500">This Pay Period</div>
                    <div className="text-2xl font-black">$4,812.50 earned</div>
                  </div>
                  <div className="rounded bg-emerald-100 px-3 py-1 text-sm font-bold text-emerald-700">
                    +18.5 hrs
                  </div>
                </div>

                <div className="grid gap-3 p-3 sm:grid-cols-3">
                  <div className="rounded border border-slate-200 p-3">
                    <div className="text-xs font-bold uppercase text-slate-500">Flagged</div>
                    <div className="mt-1 text-2xl font-black">87.5</div>
                    <div className="text-xs text-slate-500">billed hours</div>
                  </div>
                  <div className="rounded border border-slate-200 p-3">
                    <div className="text-xs font-bold uppercase text-slate-500">Rate</div>
                    <div className="mt-1 text-2xl font-black">$55</div>
                    <div className="text-xs text-slate-500">current hourly</div>
                  </div>
                  <div className="rounded border border-slate-200 p-3">
                    <div className="text-xs font-bold uppercase text-slate-500">ROs</div>
                    <div className="mt-1 text-2xl font-black">42</div>
                    <div className="text-xs text-slate-500">completed</div>
                  </div>
                </div>

                <div className="px-3 pb-3">
                  <div className="mb-2 flex items-center justify-between">
                    <div className="font-bold">Recent repair orders</div>
                    <BarChart3 className="h-5 w-5 text-sky-600" />
                  </div>
                  <div className="space-y-2">
                    {[
                      ['RO 84521', '2020 Toyota Tacoma', '3.8 hrs', '$209.00'],
                      ['RO 84540', '2018 Honda Accord', '6.2 hrs', '$341.00'],
                      ['RO 84602', '2022 Ford F-150', '4.5 hrs', '$247.50'],
                    ].map(([ro, vehicle, hours, earned]) => (
                      <div key={ro} className="grid grid-cols-[80px_1fr_70px_80px] items-center gap-2 rounded bg-slate-50 px-3 py-2 text-sm">
                        <span className="font-mono text-xs text-slate-500">{ro}</span>
                        <span className="truncate font-medium">{vehicle}</span>
                        <span className="text-right text-slate-600">{hours}</span>
                        <span className="text-right font-bold text-emerald-700">{earned}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="absolute -bottom-1 left-6 right-6 hidden rounded border border-slate-200 bg-white px-4 py-3 shadow-lg sm:block">
                <div className="flex items-center gap-3">
                  <CalendarClock className="h-5 w-5 text-amber-600" />
                  <div>
                    <div className="text-sm font-bold text-slate-900">Rate history ready</div>
                    <div className="text-xs text-slate-500">Earned pay follows the correct effective date range.</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto grid max-w-7xl gap-5 px-5 py-16 sm:px-8 lg:grid-cols-3 lg:px-10">
        {workflow.map((item) => (
          <div key={item.title} className="rounded border border-slate-200 bg-white p-6 shadow-sm">
            <item.icon className="h-8 w-8 text-sky-600" />
            <h2 className="mt-5 text-xl font-black">{item.title}</h2>
            <p className="mt-3 leading-7 text-slate-600">{item.description}</p>
          </div>
        ))}
      </section>

      <section className="bg-white">
        <div className="mx-auto grid max-w-7xl gap-10 px-5 py-16 sm:px-8 lg:grid-cols-[0.9fr_1.1fr] lg:px-10">
          <div>
            <h2 className="text-4xl font-black tracking-normal text-slate-950">
              Know your hours before payday.
            </h2>
            <p className="mt-5 text-lg leading-8 text-slate-600">
              MechDash gives mechanics a private place to organize repair orders, rate changes, and paycheck notes so surprises are easier to catch.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {features.map((feature) => (
              <div key={feature} className="flex items-start gap-3 rounded border border-slate-200 p-4">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-emerald-600" />
                <span className="font-semibold text-slate-800">{feature}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="bg-[#202a36] px-5 py-14 text-white sm:px-8">
        <div className="mx-auto flex max-w-5xl flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
          <div>
            <div className="mb-2 flex items-center gap-2 text-amber-300">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-bold">Your mechanic records, your dashboard</span>
            </div>
            <h2 className="text-3xl font-black tracking-normal">Start building your own work history today.</h2>
          </div>

          <Button asChild size="lg" className="h-12 bg-amber-500 px-6 text-base font-bold text-slate-950 hover:bg-amber-400">
            <Link href="/signup">
              Create free account
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
          </Button>
        </div>
      </section>
    </main>
  );
}
