import { useState, useEffect, Suspense, lazy } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, db, firebaseConfigError, isFirebaseConfigured, loginWithGoogle, logout } from './lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { UserProfile, Quiz, QuizResult } from './types';
import { ErrorBoundary } from './components/ErrorBoundary';
import { motion, AnimatePresence } from 'motion/react';
import { Loader2, Brain, LogOut, LayoutDashboard, Home as HomeIcon, Users } from 'lucide-react';
import Landing from './components/Landing';

const Home = lazy(() => import('./components/Home'));
const QuizPage = lazy(() => import('./components/Quiz'));
const Result = lazy(() => import('./components/Result'));
const Dashboard = lazy(() => import('./components/Dashboard'));
const About = lazy(() => import('./components/About'));

type Page = 'home' | 'quiz' | 'result' | 'dashboard' | 'about';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [currentQuiz, setCurrentQuiz] = useState<Quiz | null>(null);
  const [currentResult, setCurrentResult] = useState<QuizResult | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (nextUser) => {
      setUser(nextUser);
      setAuthError(null);

      if (nextUser) {
        try {
          const profileRef = doc(db, 'users', nextUser.uid);
          const profileDoc = await getDoc(profileRef);

          if (profileDoc.exists()) {
            setProfile(profileDoc.data() as UserProfile);
          } else {
            const newProfile: UserProfile = {
              uid: nextUser.uid,
              email: nextUser.email || 'unknown@example.com',
              displayName: nextUser.displayName || 'User',
              photoURL: nextUser.photoURL || undefined,
              createdAt: Date.now(),
              streak: 0,
              badges: []
            };
            await setDoc(profileRef, newProfile);
            setProfile(newProfile);
          }
        } catch (error) {
          console.error('Failed to load user profile:', error);
          setProfile({
            uid: nextUser.uid,
            email: nextUser.email || 'unknown@example.com',
            displayName: nextUser.displayName || 'User',
            photoURL: nextUser.photoURL || undefined,
            createdAt: Date.now(),
            streak: 0,
            badges: []
          });
          setAuthError('Signed in, but we could not load your cloud profile. Quiz history sync may be unavailable.');
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleStartQuiz = (quiz: Quiz) => {
    setCurrentQuiz(quiz);
    setCurrentPage('quiz');
  };

  const handleQuizComplete = (result: QuizResult) => {
    setCurrentResult(result);
    setCurrentPage('result');
  };

  const handleQuitQuiz = () => {
    setCurrentQuiz(null);
    setCurrentPage('home');
  };

  const showNavigation = !(currentPage === 'quiz' && currentQuiz?.isFocusMode);

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 to-white">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
          <Loader2 className="w-12 h-12 text-indigo-600" />
        </motion.div>
        <p className="mt-4 text-indigo-900 font-medium">Initializing CogniQuest...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <Landing
        isFirebaseConfigured={isFirebaseConfigured}
        firebaseConfigError={firebaseConfigError}
        onLogin={async () => {
          try {
            await loginWithGoogle();
          } catch (error) {
            alert(error instanceof Error ? error.message : 'Google sign-in failed.');
          }
        }}
      />
    );
  }

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-slate-50 flex flex-col">
        {showNavigation && (
          <nav className="sticky top-0 z-50 bg-white/70 backdrop-blur-md border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16 items-center">
                <div className="flex items-center gap-2 cursor-pointer" onClick={() => setCurrentPage('home')}>
                  <div className="p-2 bg-indigo-600 rounded-lg">
                    <Brain className="w-6 h-6 text-white" />
                  </div>
                  <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600 hidden sm:block">
                    CogniQuest
                  </span>
                </div>

                <div className="flex items-center gap-4 sm:gap-6">
                  <button
                    onClick={() => setCurrentPage('home')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${currentPage === 'home' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <HomeIcon className="w-5 h-5" />
                    <span className="hidden sm:inline">Home</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage('dashboard')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${currentPage === 'dashboard' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <LayoutDashboard className="w-5 h-5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </button>
                  <button
                    onClick={() => setCurrentPage('about')}
                    className={`flex items-center gap-2 px-3 py-2 rounded-xl transition-all ${currentPage === 'about' ? 'bg-indigo-50 text-indigo-600 font-semibold' : 'text-slate-600 hover:bg-slate-100'}`}
                  >
                    <Users className="w-5 h-5" />
                    <span className="hidden sm:inline">About</span>
                  </button>
                  <div className="h-8 w-px bg-slate-200" />
                  <div className="flex items-center gap-3">
                    <img
                      src={profile?.photoURL || 'https://ui-avatars.com/api/?name=CogniQuest&background=e0e7ff&color=3730a3'}
                      className="w-8 h-8 rounded-full border border-indigo-200"
                      alt="Profile"
                    />
                    <button onClick={logout} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-xl transition-all">
                      <LogOut className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        )}

        <main className={`flex-1 w-full ${showNavigation ? 'max-w-7xl mx-auto p-4 sm:p-6 lg:p-8' : ''}`}>
          {authError && (
            <div className="mb-6 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              {authError}
            </div>
          )}
          <AnimatePresence mode="wait">
            <Suspense fallback={<div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 text-indigo-600 animate-spin" /></div>}>
              <motion.div
                key={currentPage}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
                className="h-full"
              >
                {currentPage === 'home' && <Home onStartQuiz={handleStartQuiz} streak={profile?.streak} />}
                {currentPage === 'quiz' && currentQuiz && <QuizPage quiz={currentQuiz} onComplete={handleQuizComplete} onQuit={handleQuitQuiz} />}
                {currentPage === 'result' && currentResult && <Result result={currentResult} onGoHome={() => setCurrentPage('home')} />}
                {currentPage === 'dashboard' && <Dashboard onStartQuiz={handleStartQuiz} />}
                {currentPage === 'about' && <About />}
              </motion.div>
            </Suspense>
          </AnimatePresence>
        </main>
      </div>
    </ErrorBoundary>
  );
}
