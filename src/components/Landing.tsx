import { motion } from 'motion/react';
import { ArrowRight, Brain, CheckCircle2, Flame, GraduationCap, ShieldCheck, Sparkles } from 'lucide-react';

interface LandingProps {
  onLogin: () => Promise<void>;
  isFirebaseConfigured: boolean;
  firebaseConfigError: string | null;
}

const highlights = [
  {
    icon: Sparkles,
    title: 'AI Quiz Generation',
    description: 'Create exam-style questions from any topic in seconds.',
  },
  {
    icon: Flame,
    title: 'Momentum Tracking',
    description: 'Build consistent learning habits with daily streaks.',
  },
  {
    icon: ShieldCheck,
    title: 'Cloud-Synced Progress',
    description: 'Keep your quizzes and improvements safe across sessions.',
  },
];

const stats = [
  { label: 'Adaptive Quiz Paths', value: 'Dynamic' },
  { label: 'Learning Modes', value: 'MCQ + Subjective' },
  { label: 'Evaluation Speed', value: 'Real-time' },
];

export default function Landing({ onLogin, isFirebaseConfigured, firebaseConfigError }: LandingProps) {
  return (
    <div className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-40 left-1/2 h-[34rem] w-[34rem] -translate-x-1/2 rounded-full bg-cyan-400/20 blur-3xl" />
        <div className="absolute right-[-12rem] top-24 h-96 w-96 rounded-full bg-emerald-400/15 blur-3xl" />
        <div className="absolute bottom-[-10rem] left-[-10rem] h-80 w-80 rounded-full bg-blue-500/20 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-screen w-full max-w-7xl items-center px-4 py-14 sm:px-8 lg:px-12">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.section
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.55 }}
          >
            <div className="mb-8 inline-flex items-center gap-3 rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur">
              <Brain className="h-4 w-4 text-cyan-300" />
              Better prep starts here
            </div>

            <h1 className="max-w-2xl text-4xl font-black leading-tight tracking-tight text-white sm:text-5xl lg:text-6xl">
              Learn faster with
              <span className="block bg-gradient-to-r from-cyan-300 via-emerald-300 to-blue-300 bg-clip-text text-transparent">
                ExamPrep
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-200 sm:text-lg">
              Turn any syllabus into personalized practice. Generate quizzes, test your understanding, and improve with focused feedback.
            </p>

            <div className="mt-8 flex flex-wrap gap-3">
              {stats.map((item) => (
                <div key={item.label} className="rounded-2xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur">
                  <p className="text-xs uppercase tracking-wide text-slate-300">{item.label}</p>
                  <p className="mt-1 text-sm font-bold text-white">{item.value}</p>
                </div>
              ))}
            </div>
          </motion.section>

          <motion.section
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.65, delay: 0.1 }}
            className="rounded-3xl border border-white/15 bg-white/10 p-6 shadow-2xl backdrop-blur-xl sm:p-8"
          >
            <div className="mb-6 flex items-center gap-3">
              <div className="rounded-xl bg-cyan-300/15 p-2.5">
                <GraduationCap className="h-6 w-6 text-cyan-300" />
              </div>
              <div>
                <p className="text-sm font-semibold uppercase tracking-wide text-slate-300">Welcome to ExamPrep</p>
                <p className="text-lg font-bold text-white">Sign in to continue</p>
              </div>
            </div>

            <button
              onClick={onLogin}
              disabled={!isFirebaseConfigured}
              className="group flex w-full items-center justify-center gap-3 rounded-2xl bg-white px-5 py-4 text-base font-bold text-slate-900 transition-all hover:scale-[1.01] hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-55"
            >
              <img src="https://www.google.com/favicon.ico" className="h-5 w-5" alt="Google" />
              Continue with Google
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </button>

            {!isFirebaseConfigured && (
              <p className="mt-4 rounded-xl border border-amber-300/50 bg-amber-100 px-4 py-3 text-sm text-amber-900">
                {firebaseConfigError}
              </p>
            )}

            <div className="mt-6 space-y-3">
              {highlights.map((item) => (
                <div key={item.title} className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-900/40 px-4 py-3">
                  <item.icon className="mt-0.5 h-4.5 w-4.5 flex-shrink-0 text-emerald-300" />
                  <div>
                    <p className="text-sm font-semibold text-white">{item.title}</p>
                    <p className="text-xs leading-relaxed text-slate-300">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-5 flex items-center gap-2 text-xs text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-300" />
              Secure Google auth and personalized dashboard after login.
            </p>
          </motion.section>
        </div>
      </div>
    </div>
  );
}
