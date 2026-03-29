import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Eye } from "lucide-react";


const PAGE_SIZE = 10;


const stageRowClasses = {
  Normal: "bg-green-50/70 dark:bg-green-950/15",
  Mild: "bg-amber-50/70 dark:bg-amber-950/15",
  Severe: "bg-red-50/70 dark:bg-red-950/15",
};


function HistoryTable({ reports, onView, selectedReportId, activeViewId, loading }) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageCount = Math.max(1, Math.ceil(reports.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > pageCount) {
      setCurrentPage(pageCount);
    }
  }, [currentPage, pageCount]);

  useEffect(() => {
    setCurrentPage(1);
  }, [reports.length]);

  const currentRows = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return reports.slice(start, start + PAGE_SIZE);
  }, [currentPage, reports]);

  return (
    <section className="section-shell" id="history-section">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="hero-badge mb-3">Step 3: Review previous screenings</p>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Report History
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            Saved scans stay in SQLite with stage, probabilities, confidence, and advice. Use
            View to load any result back into the live result card.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 text-sm text-slate-600 dark:border-slate-800 dark:bg-slate-950/70 dark:text-slate-300">
          {reports.length} total reports
        </div>
      </div>

      {loading ? (
        <div className="grid min-h-[220px] place-items-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 dark:border-slate-700 dark:bg-slate-950/50">
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading report history...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="grid min-h-[220px] place-items-center rounded-[28px] border border-dashed border-slate-300 bg-white/60 text-center dark:border-slate-700 dark:bg-slate-950/50">
          <div className="max-w-lg px-6">
            <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
              No saved reports yet
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              Run the first scan from the upload panel and the result will appear here
              automatically.
            </p>
          </div>
        </div>
      ) : (
        <>
          <div className="soft-scrollbar overflow-x-auto rounded-[28px] border border-slate-200 dark:border-slate-800">
            <table className="min-w-full overflow-hidden text-left">
              <thead className="bg-slate-100/90 text-xs uppercase tracking-[0.22em] text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-5 py-4">Date</th>
                  <th className="px-5 py-4">Stage</th>
                  <th className="px-5 py-4">Confidence</th>
                  <th className="px-5 py-4">Advice</th>
                  <th className="px-5 py-4 text-right">View</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white/80 text-sm dark:divide-slate-800 dark:bg-slate-950/70">
                {currentRows.map((report) => (
                  <tr
                    key={report.id}
                    className={`${stageRowClasses[report.stage] || ""} ${
                      selectedReportId === report.id ? "ring-2 ring-brand/40" : ""
                    }`}
                  >
                    <td className="px-5 py-4 text-slate-700 dark:text-slate-200">
                      {new Date(report.created_at).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className={`stage-pill ${(report.stage || "Normal").toLowerCase()}`}>
                        {report.stage}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-semibold text-slate-800 dark:text-slate-100">
                      {Number(report.confidence).toFixed(1)}%
                    </td>
                    <td className="max-w-md px-5 py-4 text-slate-600 dark:text-slate-300">
                      {report.advice}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <button
                        type="button"
                        onClick={() => onView(report.id)}
                        disabled={activeViewId === report.id}
                        className="inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <Eye className="h-4 w-4" />
                        {activeViewId === report.id ? "Loading..." : "View"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Page {currentPage} of {pageCount}
            </p>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
                disabled={currentPage === 1}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </button>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(pageCount, page + 1))}
                disabled={currentPage === pageCount}
                className="inline-flex items-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        </>
      )}
    </section>
  );
}


export default HistoryTable;
