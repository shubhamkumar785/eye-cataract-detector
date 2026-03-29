import { useEffect, useRef, useState } from "react";
import {
  AlertTriangle,
  Download,
  Mail,
  MapPin,
  RefreshCcw,
  Save,
  ShieldCheck,
} from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import toast from "react-hot-toast";


const STAGE_META = {
  Normal: {
    color: "#16a34a",
    accentClass: "normal",
    summary: "No visible cataract signs detected.",
  },
  Mild: {
    color: "#d97706",
    accentClass: "mild",
    summary: "Early opacity markers detected and worth a specialist review.",
  },
  Severe: {
    color: "#dc2626",
    accentClass: "severe",
    summary: "High-likelihood advanced cataract pattern detected.",
  },
};


function ResultCard({ result, onSaveReport, onScanAgain, userEmail, userName, isDarkMode }) {
  const [emailTarget, setEmailTarget] = useState(userEmail || "");
  const [isExporting, setIsExporting] = useState(false);
  const [isEmailing, setIsEmailing] = useState(false);
  const cardRef = useRef(null);

  useEffect(() => {
    setEmailTarget(userEmail || "");
  }, [userEmail]);

  if (!result) {
    return (
      <section className="section-shell" id="result-section">
        <p className="hero-badge mb-3">Step 2: Review the model output</p>
        <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
          Latest Result
        </h2>
        <div className="mt-6 grid min-h-[360px] place-items-center rounded-[28px] border border-dashed border-slate-300 bg-white/70 p-10 text-center dark:border-slate-700 dark:bg-slate-950/50">
          <div className="max-w-lg">
            <div className="mx-auto mb-4 grid h-16 w-16 place-items-center rounded-3xl bg-brand/10 text-brand">
              <ShieldCheck className="h-8 w-8" />
            </div>
            <p className="font-display text-xl font-bold text-slate-900 dark:text-white">
              The result panel wakes up after the first scan
            </p>
            <p className="mt-3 text-sm text-slate-600 dark:text-slate-300">
              When a prediction arrives, this section shows the stage badge, confidence, class
              probabilities, advice, PDF export, email action, and nearby doctor shortcut.
            </p>
          </div>
        </div>
      </section>
    );
  }

  const probabilities = {
    Normal: Number(result.probabilities?.Normal || 0),
    Mild: Number(result.probabilities?.Mild || 0),
    Severe: Number(result.probabilities?.Severe || 0),
  };

  const stageInfo = STAGE_META[result.stage] || STAGE_META.Normal;
  const severityScore = Math.min(
    100,
    Math.round(probabilities.Severe + probabilities.Mild * 0.5),
  );
  const chartData = Object.entries(probabilities).map(([name, value]) => ({
    name,
    value,
    fill: STAGE_META[name]?.color || "#4f46e5",
  }));
  const sourceLabel =
    result.source === "webcam"
      ? "Webcam snapshot"
      : result.source === "history"
        ? "Loaded from history"
        : "Uploaded image";
  const reportDate = new Date(result.created_at || Date.now()).toLocaleString();
  const isDemoMode = result.analysis_mode === "heuristic_demo";

  const handleExportPdf = async () => {
    if (!cardRef.current) {
      return;
    }

    setIsExporting(true);

    try {
      const [{ default: html2canvas }, { jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);

      const canvas = await html2canvas(cardRef.current, {
        scale: 2,
        backgroundColor: isDarkMode ? "#020617" : "#ffffff",
      });

      const imageData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 10;
      let renderWidth = pageWidth - margin * 2;
      let renderHeight = (canvas.height * renderWidth) / canvas.width;

      if (renderHeight > pageHeight - margin * 2) {
        renderHeight = pageHeight - margin * 2;
        renderWidth = (canvas.width * renderHeight) / canvas.height;
      }

      pdf.addImage(imageData, "PNG", margin, margin, renderWidth, renderHeight);
      pdf.save(`cataract-report-${result.report_id || "scan"}.pdf`);
      toast.success("PDF report exported.");
    } catch (error) {
      toast.error("Unable to export the PDF right now.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleEmailReport = async () => {
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    if (!emailTarget.trim()) {
      toast.error("Enter an email address before sending the report.");
      return;
    }

    if (!serviceId || !templateId || !publicKey) {
      toast.error("EmailJS keys are missing. Add them to a frontend .env file first.");
      return;
    }

    setIsEmailing(true);

    try {
      const { default: emailjs } = await import("@emailjs/browser");

      await emailjs.send(
        serviceId,
        templateId,
        {
          to_email: emailTarget,
          patient_name: userName || "Patient",
          stage: result.stage,
          confidence: `${Number(result.confidence).toFixed(2)}%`,
          advice: result.advice,
          scan_date: reportDate,
          report_id: result.report_id || "N/A",
        },
        {
          publicKey,
        },
      );

      toast.success("Report emailed successfully.");
    } catch (error) {
      toast.error("Email send failed. Check your EmailJS configuration.");
    } finally {
      setIsEmailing(false);
    }
  };

  const handleDoctorRecommendation = () => {
    const openDoctorSearch = (latitude, longitude) => {
      const url =
        latitude && longitude
          ? `https://www.google.com/maps/search/ophthalmologist/@${latitude},${longitude},14z`
          : "https://www.google.com/maps/search/ophthalmologist+near+me";
      window.open(url, "_blank", "noopener,noreferrer");
    };

    if (!navigator.geolocation) {
      openDoctorSearch();
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => openDoctorSearch(position.coords.latitude, position.coords.longitude),
      () => openDoctorSearch(),
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  };

  return (
    <section className="section-shell" id="result-section">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="hero-badge mb-3">Step 2: Model output and clinical guidance</p>
          <h2 className="font-display text-2xl font-bold text-slate-900 dark:text-white">
            Latest Result
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 dark:text-slate-300">
            The model produces a three-class prediction with probability scores and a recommended
            next action. Use this as a screening aid, not as a substitute for diagnosis.
          </p>
        </div>

        <div className={`stage-pill ${stageInfo.accentClass}`}>
          {result.stage} stage detected
        </div>
      </div>

      {result.model_message ? (
        <div
          className={`mb-6 flex items-start gap-3 rounded-[24px] border px-4 py-4 text-sm ${
            isDemoMode
              ? "border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-100"
              : "border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-100"
          }`}
        >
          {isDemoMode ? (
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0" />
          ) : (
            <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" />
          )}
          <div>
            <p className="font-semibold">
              {isDemoMode ? "Demo fallback analysis" : "Trained model analysis"}
            </p>
            <p className="mt-1 leading-6">{result.model_message}</p>
          </div>
        </div>
      ) : null}

      <div
        ref={cardRef}
        className="grid gap-6 rounded-[28px] border border-slate-200 bg-white/70 p-5 dark:border-slate-800 dark:bg-slate-950/40 lg:grid-cols-[0.9fr_1.1fr]"
      >
        <div className="grid gap-5">
          <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/80">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Scan Snapshot
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{sourceLabel}</p>
              </div>
              <div className="text-right text-sm text-slate-500 dark:text-slate-400">
                <p>Report ID</p>
                <p className="font-semibold text-slate-800 dark:text-slate-100">
                  #{result.report_id || "Pending"}
                </p>
              </div>
            </div>

            <div className="grid min-h-[260px] place-items-center overflow-hidden rounded-[24px] border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
              {result.previewUrl ? (
                <img
                  src={result.previewUrl}
                  alt="Prediction input"
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="max-w-sm px-6 text-center text-sm text-slate-500 dark:text-slate-400">
                  The original image preview is not stored in browser memory for history-loaded
                  reports. The database still keeps the prediction summary and filename.
                </div>
              )}
            </div>

            <div className="grid gap-3 rounded-[22px] bg-white/90 p-4 dark:bg-slate-950/80">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Advice
              </p>
              <p className="text-sm leading-6 text-slate-700 dark:text-slate-200">{result.advice}</p>
            </div>
          </div>

          <div className="grid gap-3 rounded-[24px] border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Email Report
                </p>
                <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                  Uses EmailJS if frontend environment variables are configured.
                </p>
              </div>
              <Mail className="h-5 w-5 text-brand" />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row">
              <input
                type="email"
                value={emailTarget}
                onChange={(event) => setEmailTarget(event.target.value)}
                placeholder="doctor-or-patient@example.com"
                className="flex-1 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
              />
              <button
                type="button"
                onClick={handleEmailReport}
                disabled={isEmailing}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <Mail className="h-4 w-4" />
                {isEmailing ? "Sending..." : "Email Report"}
              </button>
            </div>
          </div>
        </div>

        <div className="grid gap-5">
          <div className="grid gap-4 rounded-[24px] border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/70 md:grid-cols-[0.45fr_0.55fr]">
            <div className="grid gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Predicted Stage
                </p>
                <h3 className="mt-2 font-display text-3xl font-bold text-slate-900 dark:text-white">
                  {result.stage}
                </h3>
                <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                  {stageInfo.summary}
                </p>
              </div>

              <div className="rounded-[22px] bg-white/90 p-4 dark:bg-slate-950/80">
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  Confidence
                </p>
                <p className="mt-2 font-display text-5xl font-bold text-slate-900 dark:text-white">
                  {Number(result.confidence).toFixed(1)}%
                </p>
                <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">{reportDate}</p>
              </div>
            </div>

            <div className="grid place-items-center rounded-[24px] bg-white/90 p-5 dark:bg-slate-950/80">
              <div
                className="severity-shell h-44 w-44"
                style={{
                  background: `conic-gradient(${stageInfo.color} 0deg ${
                    severityScore * 3.6
                  }deg, rgba(148,163,184,0.18) ${severityScore * 3.6}deg 360deg)`,
                }}
              >
                <div className="grid h-[136px] w-[136px] place-items-center rounded-full bg-white text-center shadow-inner dark:bg-slate-950">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                      Severity
                    </p>
                    <p className="font-display text-4xl font-bold text-slate-900 dark:text-white">
                      {severityScore}
                    </p>
                    <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">out of 100</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="rounded-[24px] border border-slate-200 bg-slate-50/90 p-5 dark:border-slate-800 dark:bg-slate-900/70">
            <div className="mb-4">
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                Class Probabilities
              </p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">
                Percentage distribution across Normal, Mild, and Severe.
              </p>
            </div>
            <div className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.25} />
                  <XAxis dataKey="name" tickLine={false} axisLine={false} />
                  <YAxis tickLine={false} axisLine={false} unit="%" />
                  <Tooltip formatter={(value) => `${Number(value).toFixed(2)}%`} />
                  <Bar dataKey="value" radius={[14, 14, 0, 0]}>
                    {chartData.map((entry) => (
                      <Cell key={entry.name} fill={entry.fill} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
            <button
              type="button"
              onClick={onSaveReport}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5"
            >
              <Save className="h-4 w-4" />
              Save Report
            </button>
            <button
              type="button"
              onClick={handleExportPdf}
              disabled={isExporting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <Download className="h-4 w-4" />
              {isExporting ? "Exporting..." : "Export PDF"}
            </button>
            <button
              type="button"
              onClick={handleDoctorRecommendation}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <MapPin className="h-4 w-4" />
              Nearby Doctor
            </button>
            <button
              type="button"
              onClick={handleEmailReport}
              disabled={isEmailing}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <Mail className="h-4 w-4" />
              Send Email
            </button>
            <button
              type="button"
              onClick={onScanAgain}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm font-semibold text-slate-700 transition hover:-translate-y-0.5 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
            >
              <RefreshCcw className="h-4 w-4" />
              Scan Again
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}


export default ResultCard;
