import { ArrowRight, Camera, FileBarChart2, ShieldPlus, UploadCloud } from "lucide-react";
import { Link } from "react-router-dom";

import Navbar from "../components/Navbar";


const steps = [
  {
    title: "Upload or capture",
    description: "Send an eye image through drag-and-drop upload or the built-in webcam capture flow.",
    icon: UploadCloud,
  },
  {
    title: "Analyze instantly",
    description: "The Flask API preprocesses the image and runs MobileNetV2-based stage prediction.",
    icon: Camera,
  },
  {
    title: "Review and act",
    description: "See stage confidence, advice, PDF export, doctor lookup, and saved history.",
    icon: FileBarChart2,
  },
];

const features = [
  "MobileNetV2 transfer learning for Normal, Mild, and Severe screening output.",
  "SQLite-backed patient report history with dashboard stats and recent scan summaries.",
  "Interview-friendly extras: webcam capture, PDF export, severity meter, doctor lookup, dark mode, and EmailJS support.",
];


function Home({ authUser, isDarkMode, onToggleTheme, onLogout }) {
  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8">
        <Navbar
          authUser={authUser}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
          showLandingLinks
        />

        <section className="grid gap-8 px-1 py-10 lg:grid-cols-[1.08fr_0.92fr] lg:py-16">
          <div className="fade-up">
            <span className="hero-badge">
              <ShieldPlus className="h-4 w-4 text-brand" />
              AI-assisted eye screening for clinics and outreach programs
            </span>
            <h1 className="mt-6 max-w-3xl font-display text-5xl font-black leading-tight text-slate-900 md:text-6xl dark:text-white">
              AI-Powered Cataract Detection that feels clinic-ready, not just demo-ready.
            </h1>
            <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-600 dark:text-slate-300">
              This web application classifies eye images into Normal, Mild Cataract, and Severe
              Cataract, then turns the result into an actionable screening workflow with history,
              charts, PDF export, and referral support.
            </p>

            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                to={authUser?.token ? "/dashboard" : "/login"}
                className="inline-flex items-center gap-2 rounded-2xl bg-brand px-6 py-4 text-base font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5"
              >
                Open Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="#how-it-works"
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-6 py-4 text-base font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
              >
                See Workflow
              </a>
            </div>

            <div className="mt-10 grid gap-4 md:grid-cols-3">
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Output classes
                </p>
                <p className="mt-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
                  3
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">Normal, Mild, Severe</p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Stack
                </p>
                <p className="mt-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
                  Flask + React
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  TensorFlow, SQLite, Tailwind
                </p>
              </div>
              <div className="metric-card">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Use case
                </p>
                <p className="mt-3 font-display text-3xl font-bold text-slate-900 dark:text-white">
                  Early screening
                </p>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  Rural camps, mobile clinics, outreach
                </p>
              </div>
            </div>
          </div>

          <div className="grid-lines glass-card floaty relative overflow-hidden p-6 md:p-8">
            <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-brand/10 to-transparent" />
            <div className="relative grid gap-5">
              <div className="rounded-[28px] bg-slate-950 p-6 text-white shadow-2xl shadow-slate-900/20">
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-300">
                  Screening flow
                </p>
                <h2 className="mt-3 font-display text-3xl font-bold">
                  Fast triage support with a clear human handoff.
                </h2>
                <div className="mt-6 grid gap-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Normal</p>
                    <p className="mt-1 text-lg font-semibold text-white">Continue routine eye check-ups</p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Mild Cataract</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      Suggest ophthalmologist consultation
                    </p>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                    <p className="text-sm text-slate-300">Severe Cataract</p>
                    <p className="mt-1 text-lg font-semibold text-white">
                      Escalate toward surgical evaluation
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {["Normal", "Mild", "Severe"].map((stage) => (
                  <div key={stage} className="rounded-[24px] border border-slate-200 bg-white/80 p-4 dark:border-slate-800 dark:bg-slate-900/70">
                    <span className={`stage-pill ${stage.toLowerCase()}`}>{stage}</span>
                    <p className="mt-4 text-sm text-slate-600 dark:text-slate-300">
                      Probability bars, severity meter, and tailored advice are presented together.
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section id="how-it-works" className="px-1 py-8 md:py-12">
          <div className="mb-8 max-w-2xl">
            <p className="hero-badge">How it works</p>
            <h2 className="mt-4 font-display text-4xl font-bold text-slate-900 dark:text-white">
              Four-click screening workflow
            </h2>
          </div>

          <div className="grid gap-5 md:grid-cols-3">
            {steps.map((step, index) => (
              <article key={step.title} className="section-shell fade-up" style={{ animationDelay: `${index * 120}ms` }}>
                <div className="mb-4 inline-flex rounded-2xl bg-brand/10 p-3 text-brand">
                  <step.icon className="h-6 w-6" />
                </div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Step {index + 1}
                </p>
                <h3 className="mt-3 font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {step.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
                  {step.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section id="features" className="px-1 py-8 md:py-12">
          <div className="section-shell">
            <div className="mb-6 max-w-2xl">
              <p className="hero-badge">What makes the build stand out</p>
              <h2 className="mt-4 font-display text-4xl font-bold text-slate-900 dark:text-white">
                Interview-friendly features with practical value
              </h2>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              {features.map((feature) => (
                <div
                  key={feature}
                  className="rounded-[24px] border border-slate-200 bg-slate-50/80 p-5 text-sm leading-7 text-slate-700 dark:border-slate-800 dark:bg-slate-950/60 dark:text-slate-200"
                >
                  {feature}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="disclaimer" className="px-1 pb-14 pt-8 md:pb-20">
          <div className="glass-card overflow-hidden">
            <div className="grid gap-6 bg-slate-950 px-6 py-8 text-white md:px-8 lg:grid-cols-[1fr_0.9fr]">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-300">
                  Clinical guardrail
                </p>
                <h2 className="mt-4 font-display text-4xl font-bold">
                  This system assists doctors. It does not replace clinical judgment.
                </h2>
              </div>
              <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 text-sm leading-7 text-slate-200">
                Model choice: MobileNetV2 transfer learning fine-tuned on cataract eye images.
                The goal is early screening support for rural health camps, mobile clinics, and
                triage settings where a quick second signal is genuinely useful.
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


export default Home;
