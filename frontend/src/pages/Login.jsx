import { useState } from "react";
import { ArrowRight, CheckCircle2 } from "lucide-react";
import { Navigate, useNavigate } from "react-router-dom";
import toast from "react-hot-toast";

import Navbar from "../components/Navbar";
import { login, register } from "../api";


const defaultForm = {
  name: "",
  email: "",
  password: "",
};


function Login({ authUser, isDarkMode, onToggleTheme, onLogout, onAuthChange }) {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(defaultForm);
  const [submitting, setSubmitting] = useState(false);

  if (authUser?.token) {
    return <Navigate to="/dashboard" replace />;
  }

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const persistSession = (response) => {
    localStorage.setItem("token", response.token);
    localStorage.setItem("user_id", response.user_id);
    localStorage.setItem("user_name", response.name || form.name || "");
    localStorage.setItem("user_email", response.email || form.email || "");
    onAuthChange();
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);

    try {
      const payload =
        mode === "register"
          ? {
              name: form.name,
              email: form.email,
              password: form.password,
            }
          : {
              email: form.email,
              password: form.password,
            };

      const response = mode === "register" ? await register(payload) : await login(payload);
      persistSession(response);
      toast.success(mode === "register" ? "Account created successfully." : "Welcome back.");
      navigate("/dashboard");
    } catch (error) {
      toast.error(error.response?.data?.error || "Authentication failed. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-5 md:px-6 lg:px-8">
        <Navbar
          authUser={authUser}
          isDarkMode={isDarkMode}
          onToggleTheme={onToggleTheme}
          onLogout={onLogout}
        />

        <section className="grid min-h-[calc(100vh-160px)] items-center gap-8 py-10 lg:grid-cols-[0.92fr_1.08fr]">
          <div className="section-shell order-2 lg:order-1">
            <p className="hero-badge mb-4">Secure access</p>
            <h1 className="font-display text-4xl font-bold text-slate-900 dark:text-white">
              {mode === "login" ? "Sign in to continue screening" : "Create a screening account"}
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-600 dark:text-slate-300">
              Register once, then every prediction is saved into a searchable SQLite report
              history. The app stores your session token locally for the dashboard.
            </p>

            <div className="mt-6 inline-flex rounded-2xl border border-slate-200 bg-slate-100/80 p-1 dark:border-slate-800 dark:bg-slate-900">
              {[
                { value: "login", label: "Login" },
                { value: "register", label: "Register" },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setMode(option.value)}
                  className={`rounded-2xl px-4 py-2 text-sm font-semibold transition ${
                    mode === option.value
                      ? "bg-white text-slate-900 shadow-sm dark:bg-slate-800 dark:text-white"
                      : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmit} className="mt-8 grid gap-4">
              {mode === "register" ? (
                <label className="grid gap-2">
                  <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Name</span>
                  <input
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                    placeholder="Dr. or user name"
                  />
                </label>
              ) : null}

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">Email</span>
                <input
                  type="email"
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="you@example.com"
                />
              </label>

              <label className="grid gap-2">
                <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                </span>
                <input
                  type="password"
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                  className="rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-brand dark:border-slate-700 dark:bg-slate-950 dark:text-slate-100"
                  placeholder="Minimum 6 characters"
                />
              </label>

              <button
                type="submit"
                disabled={submitting}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-2xl bg-brand px-5 py-4 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Please wait..." : mode === "login" ? "Login" : "Create Account"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>

          <div className="glass-card order-1 overflow-hidden bg-slate-950 text-white lg:order-2">
            <div className="grid h-full gap-6 px-6 py-8 md:px-8">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-300">
                  Why this workflow works
                </p>
                <h2 className="mt-4 font-display text-4xl font-bold">
                  Built for fast screening without losing clinical context.
                </h2>
              </div>

              <div className="grid gap-4">
                {[
                  "Secure register/login flow with token-based API access.",
                  "Prediction results saved automatically into patient report history.",
                  "Dashboard includes charts, confidence summaries, and extra export features.",
                ].map((item) => (
                  <div
                    key={item}
                    className="flex items-start gap-3 rounded-[24px] border border-white/10 bg-white/5 p-4"
                  >
                    <CheckCircle2 className="mt-0.5 h-5 w-5 text-cyan-300" />
                    <p className="text-sm leading-7 text-slate-200">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}


export default Login;
