import { Eye, LayoutDashboard, LogIn, LogOut, MoonStar, SunMedium } from "lucide-react";
import { Link, useLocation } from "react-router-dom";


function Navbar({
  authUser,
  isDarkMode,
  onToggleTheme,
  onLogout,
  showLandingLinks = false,
  compact = false,
}) {
  const location = useLocation();
  const onDashboard = location.pathname === "/dashboard";

  return (
    <header
      className={`glass-card ${
        compact ? "px-4 py-3" : "px-5 py-4 md:px-6"
      } sticky top-4 z-30`}
    >
      <div className="flex items-center justify-between gap-4">
        <Link to="/" className="flex items-center gap-3">
          <div className="grid h-11 w-11 place-items-center rounded-2xl bg-brand text-white shadow-lg shadow-brand/20">
            <Eye className="h-5 w-5" />
          </div>
          <div>
            <p className="font-display text-base font-bold text-slate-900 dark:text-white">
              Cataract AI
            </p>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Screening dashboard
            </p>
          </div>
        </Link>

        {showLandingLinks ? (
          <nav className="hidden items-center gap-6 text-sm text-slate-600 md:flex dark:text-slate-300">
            <a href="#how-it-works" className="transition hover:text-brand">
              How It Works
            </a>
            <a href="#features" className="transition hover:text-brand">
              Features
            </a>
            <a href="#disclaimer" className="transition hover:text-brand">
              Clinical Note
            </a>
          </nav>
        ) : null}

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onToggleTheme}
            className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white text-slate-700 transition hover:-translate-y-0.5 hover:border-brand hover:text-brand dark:border-slate-800 dark:bg-slate-950 dark:text-slate-200"
            aria-label="Toggle dark mode"
          >
            {isDarkMode ? <SunMedium className="h-5 w-5" /> : <MoonStar className="h-5 w-5" />}
          </button>

          {authUser?.token ? (
            <>
              {!onDashboard ? (
                <Link
                  to="/dashboard"
                  className="hidden items-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5 md:inline-flex"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              ) : null}

              <button
                type="button"
                onClick={onLogout}
                className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition ${
                  compact
                    ? "bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-100"
                    : "border border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50 dark:border-slate-800 dark:bg-slate-950 dark:text-slate-100"
                }`}
              >
                <LogOut className="h-4 w-4" />
                <span className={compact ? "hidden sm:inline" : ""}>Logout</span>
              </button>
            </>
          ) : (
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-2xl bg-brand px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-brand/20 transition hover:-translate-y-0.5"
            >
              <LogIn className="h-4 w-4" />
              Login
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}


export default Navbar;
