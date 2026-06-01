import { useState, useEffect, Fragment } from 'react';
import { Link, NavLink } from 'react-router-dom';
import { Menu, Transition } from '@headlessui/react';
import { useAuth } from '../../hooks/useAuth';
import {
  Bars3Icon,
  XMarkIcon,
  CalendarDaysIcon,
  UserCircleIcon,
  Squares2X2Icon,
  ShieldCheckIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/events', label: 'Events' },
];

export default function Navbar() {
  const { user, isAuth, isOrganizer, isAdmin, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handler);
    handler();
    return () => window.removeEventListener('scroll', handler);
  }, []);

  const navClass = ({ isActive }) =>
    `relative px-4 py-2 rounded-full text-sm font-semibold transition-all duration-300 ${
      isActive
        ? 'text-white bg-white/10 shadow-[0_0_20px_rgba(124,58,237,0.35)]'
        : 'text-slate-300 hover:text-white hover:bg-white/10'
    }`;

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-slate-950/80 backdrop-blur-2xl border-b border-white/10 shadow-[0_10px_35px_rgba(0,0,0,0.35)]'
          : 'bg-slate-950/45 backdrop-blur-xl border-b border-white/5'
      }`}
    >
      <div className="container-app">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="group flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 rounded-2xl bg-cyan-400/40 blur-xl opacity-0 group-hover:opacity-100 transition" />
              <div className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 via-fuchsia-600 to-cyan-500 shadow-[0_0_24px_rgba(124,58,237,0.5)]">
                <CalendarDaysIcon className="h-4 w-4 text-white" />
              </div>
            </div>

            <div>
              <span className="block font-display text-lg font-black tracking-tight bg-gradient-to-r from-white via-violet-200 to-cyan-200 bg-clip-text text-transparent">
                EventHub
              </span>
              <span className="-mt-1 hidden text-[10px] font-semibold uppercase tracking-[0.28em] text-cyan-300/80 sm:block">
                Smart Events
              </span>
            </div>
          </Link>

          <nav className="hidden md:flex items-center rounded-full border border-white/10 bg-white/[0.04] p-1 backdrop-blur-xl">
            {navLinks.map(({ to, label }) => (
              <NavLink key={to} to={to} end={to === '/'} className={navClass}>
                {label}
              </NavLink>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {!isAuth ? (
              <>
                {!isOrganizer && (
                  <Link
                    to="/register"
                    className="group flex items-center gap-1.5 text-sm font-semibold text-slate-300 transition hover:text-cyan-300"
                  >
                    <SparklesIcon className="h-4 w-4" />
                    Become Organizer
                  </Link>
                )}

                <Link
                  to="/login"
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                >
                  Sign In
                </Link>

                <Link
                  to="/register"
                  className="rounded-full bg-gradient-to-r from-violet-600 to-cyan-500 px-4 py-2 text-sm font-black text-white shadow-[0_0_25px_rgba(124,58,237,0.45)] transition hover:-translate-y-0.5 hover:shadow-[0_0_40px_rgba(6,182,212,0.5)]"
                >
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {isOrganizer && (
                  <Link
                    to="/dashboard"
                    className="flex items-center gap-1.5 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-white transition hover:bg-white/10"
                  >
                    <Squares2X2Icon className="h-4 w-4" />
                    Dashboard
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    to="/admin"
                    className="flex items-center gap-1.5 rounded-full border border-violet-400/30 bg-violet-500/10 px-4 py-2 text-sm font-bold text-violet-100 transition hover:bg-violet-500/20"
                  >
                    <ShieldCheckIcon className="h-4 w-4" />
                    Admin
                  </Link>
                )}

                <Menu as="div" className="relative">
                  <Menu.Button className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 p-1 pr-3 transition hover:bg-white/10">
                    {user?.avatar ? (
                      <img
                        src={user.avatar}
                        alt={user.name}
                        className="h-8 w-8 rounded-full object-cover ring-2 ring-cyan-400/60"
                      />
                    ) : (
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-violet-600 to-cyan-500 text-sm font-black text-white">
                        {user?.name?.[0]?.toUpperCase() || 'U'}
                      </div>
                    )}
                    <span className="max-w-[130px] truncate text-sm font-semibold text-slate-200">
                      {user?.name}
                    </span>
                  </Menu.Button>

                  <Transition
                    as={Fragment}
                    enter="transition ease-out duration-150"
                    enterFrom="transform opacity-0 scale-95 translate-y-2"
                    enterTo="transform opacity-100 scale-100 translate-y-0"
                    leave="transition ease-in duration-100"
                    leaveFrom="transform opacity-100 scale-100"
                    leaveTo="transform opacity-0 scale-95"
                  >
                    <Menu.Items className="absolute right-0 mt-3 w-56 overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 p-2 shadow-[0_20px_60px_rgba(0,0,0,0.5)] backdrop-blur-2xl focus:outline-none">
                      <Menu.Item>
                        {({ active }) => (
                          <Link
                            to="/profile"
                            className={`flex items-center gap-2.5 rounded-xl px-4 py-3 text-sm font-semibold ${
                              active ? 'bg-white/10 text-white' : 'text-slate-300'
                            }`}
                          >
                            <UserCircleIcon className="h-4 w-4" />
                            My Profile
                          </Link>
                        )}
                      </Menu.Item>

                      <div className="my-1 border-t border-white/10" />

                      <Menu.Item>
                        {({ active }) => (
                          <button
                            onClick={logout}
                            className={`w-full rounded-xl px-4 py-3 text-left text-sm font-bold text-red-300 ${
                              active ? 'bg-red-500/10' : ''
                            }`}
                          >
                            Sign Out
                          </button>
                        )}
                      </Menu.Item>
                    </Menu.Items>
                  </Transition>
                </Menu>
              </>
            )}
          </div>

          <button
            className="md:hidden rounded-xl border border-white/10 bg-white/5 p-2 text-slate-200"
            onClick={() => setMobileOpen(!mobileOpen)}
          >
            {mobileOpen ? <XMarkIcon className="h-6 w-6" /> : <Bars3Icon className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-white/10 bg-slate-950/95 backdrop-blur-2xl">
          <div className="container-app flex flex-col gap-2 py-4">
            {navLinks.map(({ to, label }) => (
              <NavLink
                key={to}
                to={to}
                end={to === '/'}
                onClick={() => setMobileOpen(false)}
                className={({ isActive }) =>
                  `rounded-xl px-4 py-3 text-sm font-bold ${
                    isActive ? 'bg-white/10 text-white' : 'text-slate-300'
                  }`
                }
              >
                {label}
              </NavLink>
            ))}

            <div className="my-2 border-t border-white/10" />

            {!isAuth ? (
              <>
                <Link to="/login" onClick={() => setMobileOpen(false)} className="btn-md btn-secondary">
                  Sign In
                </Link>
                <Link to="/register" onClick={() => setMobileOpen(false)} className="btn-md btn-primary">
                  Get Started
                </Link>
              </>
            ) : (
              <>
                {isOrganizer && (
                  <Link to="/dashboard" onClick={() => setMobileOpen(false)} className="btn-md btn-secondary">
                    Dashboard
                  </Link>
                )}
                <Link to="/profile" onClick={() => setMobileOpen(false)} className="btn-md btn-secondary">
                  Profile
                </Link>
                <button
                  onClick={() => {
                    logout();
                    setMobileOpen(false);
                  }}
                  className="btn-md btn-danger"
                >
                  Sign Out
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </header>
  );
}