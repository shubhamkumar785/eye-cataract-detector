import { Activity, Clock3, Database } from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";


const STAGE_COLORS = {
  Normal: "#16a34a",
  Mild: "#d97706",
  Severe: "#dc2626",
};


function StageChart({ stats }) {
  const data = [
    { name: "Normal", value: Number(stats?.stage_counts?.Normal || 0) },
    { name: "Mild", value: Number(stats?.stage_counts?.Mild || 0) },
    { name: "Severe", value: Number(stats?.stage_counts?.Severe || 0) },
  ];

  return (
    <section className="section-shell" id="stats-section">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="hero-badge mb-3">Step 4: Track screening performance</p>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Scan Statistics
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            The stats panel summarizes stage distribution, scan volume, average confidence, and
            the most recent reports for quick dashboard reviews.
          </p>
        </div>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <div className="grid gap-4">
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="metric-card">
              <div className="mb-3 inline-flex rounded-2xl bg-brand/10 p-3 text-brand">
                <Database className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Total Scans
              </p>
              <p className="mt-3 font-display text-4xl font-bold text-slate-900 dark:text-white">
                {Number(stats?.total_scans || 0)}
              </p>
            </div>

            <div className="metric-card">
              <div className="mb-3 inline-flex rounded-2xl bg-cyan-500/10 p-3 text-cyan-600">
                <Activity className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Average Confidence
              </p>
              <p className="mt-3 font-display text-4xl font-bold text-slate-900 dark:text-white">
                {Number(stats?.accuracy_avg || 0).toFixed(1)}%
              </p>
            </div>

            <div className="metric-card md:col-span-2 xl:col-span-1">
              <div className="mb-3 inline-flex rounded-2xl bg-slate-200/70 p-3 text-slate-700 dark:bg-slate-800 dark:text-slate-200">
                <Clock3 className="h-5 w-5" />
              </div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Recent Reports
              </p>
              <p className="mt-3 font-display text-4xl font-bold text-slate-900 dark:text-white">
                {Number(stats?.recent_scans?.length || 0)}
              </p>
            </div>
          </div>

          <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Recent Scans
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Latest reports returned by the API for fast trend review.
              </p>
            </div>

            <div className="grid gap-3">
              {(stats?.recent_scans || []).length > 0 ? (
                stats.recent_scans.map((report) => (
                  <div
                    key={report.id}
                    className="flex flex-col gap-3 rounded-[22px] border border-slate-200 bg-white/90 p-4 dark:border-slate-800 dark:bg-slate-950/70 md:flex-row md:items-center md:justify-between"
                  >
                    <div>
                      <p className="font-semibold text-slate-900 dark:text-white">
                        Report #{report.id}
                      </p>
                      <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                        {new Date(report.created_at).toLocaleString()}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                      <span className={`stage-pill ${(report.stage || "Normal").toLowerCase()}`}>
                        {report.stage}
                      </span>
                      <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                        {Number(report.confidence).toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="rounded-[22px] border border-dashed border-slate-300 bg-white/70 p-6 text-sm text-slate-500 dark:border-slate-700 dark:bg-slate-950/50 dark:text-slate-400">
                  Run a few scans and the latest items will appear here.
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-200 bg-slate-50/80 p-5 dark:border-slate-800 dark:bg-slate-900/60">
          <div className="mb-4">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
              Stage Distribution
            </p>
            <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
              Pie chart for Normal, Mild, and Severe predictions across all saved scans.
            </p>
          </div>

          <div className="h-[320px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  dataKey="value"
                  nameKey="name"
                  innerRadius={70}
                  outerRadius={110}
                  paddingAngle={4}
                >
                  {data.map((entry) => (
                    <Cell key={entry.name} fill={STAGE_COLORS[entry.name]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="grid gap-3">
            {data.map((entry) => (
              <div
                key={entry.name}
                className="flex items-center justify-between rounded-[22px] border border-slate-200 bg-white/90 px-4 py-3 dark:border-slate-800 dark:bg-slate-950/70"
              >
                <div className="flex items-center gap-3">
                  <span
                    className="inline-block h-3 w-3 rounded-full"
                    style={{ backgroundColor: STAGE_COLORS[entry.name] }}
                  />
                  <span className="font-medium text-slate-800 dark:text-slate-100">{entry.name}</span>
                </div>
                <span className="font-display text-2xl font-bold text-slate-900 dark:text-white">
                  {entry.value}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


export default StageChart;
