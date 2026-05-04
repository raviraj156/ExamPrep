import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { db, auth, handleFirestoreError, isFirebaseConfigured, OperationType } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { QuizResult, Quiz, UserProfile } from '../types';
import { XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, AreaChart, Area } from 'recharts';
import { Brain, Calendar, TrendingUp, ChevronRight, Loader2, Sparkles, Flame, Award, CheckCircle2, CircleDashed, Bookmark } from 'lucide-react';

interface DashboardProps {
  onStartQuiz: (quiz: Quiz) => void;
}

export default function Dashboard({ onStartQuiz: _onStartQuiz }: DashboardProps) {
  const [results, setResults] = useState<QuizResult[]>([]);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedQuizId, setExpandedQuizId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      if (!auth.currentUser || !isFirebaseConfigured) {
        setLoading(false);
        return;
      }

      try {
        const resultsQuery = query(
          collection(db, 'results'),
          where('userId', '==', auth.currentUser.uid)
        );
        const snapshot = await getDocs(resultsQuery);
        const fetchedResults = snapshot.docs
          .map((resultDoc) => resultDoc.data() as QuizResult)
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, 10);

        setResults(fetchedResults);

        const profileDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (profileDoc.exists()) {
          setProfile(profileDoc.data() as UserProfile);
        }
      } catch (error) {
        console.error('Failed to load dashboard data:', error);
        try {
          handleFirestoreError(error, OperationType.LIST, 'results');
        } catch (firestoreError) {
          console.error(firestoreError);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const chartData = [...results].reverse().map((res, index) => ({
    index: index + 1,
    topic: res.topic || `Quiz ${index + 1}`,
    scoreLabel: `${Math.round(res.totalScore)}/${Math.round(res.maxScore)}`,
    marksObtained: Number(res.totalScore.toFixed(2)),
    maxScore: Number(res.maxScore.toFixed(2))
  }));

  const averageScore = results.length > 0
    ? Math.round(results.reduce((acc, res) => acc + (res.maxScore > 0 ? res.totalScore / res.maxScore : 0), 0) / results.length * 100)
    : 0;

  const totalAttemptedQuestions = results.reduce((acc, res) => acc + (res.attemptedCount || 0), 0);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-12 h-12 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto pt-8 pb-20">
      <div className="mb-12">
        <h1 className="text-4xl font-extrabold text-slate-900 mb-2 tracking-tight">
          Your Learning <span className="text-indigo-600">Dashboard</span>
        </h1>
        <p className="text-lg text-slate-600">Track your progress and review your previous quiz attempts.</p>
        {!isFirebaseConfigured && (
          <p className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            Dashboard sync is unavailable until Firebase environment variables are configured.
          </p>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100">
          <div className="w-10 h-10 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Avg Score</p>
          <p className="text-2xl font-bold text-slate-900">{averageScore}%</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100">
          <div className="w-10 h-10 bg-purple-50 rounded-xl flex items-center justify-center mb-4">
            <Brain className="w-5 h-5 text-purple-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Quizzes</p>
          <p className="text-2xl font-bold text-slate-900">{results.length}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100">
          <div className="w-10 h-10 bg-sky-50 rounded-xl flex items-center justify-center mb-4">
            <CheckCircle2 className="w-5 h-5 text-sky-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Questions Attempted</p>
          <p className="text-2xl font-bold text-slate-900">{totalAttemptedQuestions}</p>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="bg-white p-6 rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100">
          <div className="w-10 h-10 bg-orange-50 rounded-xl flex items-center justify-center mb-4">
            <Flame className="w-5 h-5 text-orange-600" />
          </div>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Streak</p>
          <p className="text-2xl font-bold text-slate-900">{profile?.streak || 0} Days</p>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 p-8">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold text-slate-900">Performance Trend</h3>
            <div className="flex items-center gap-2 text-sm font-medium text-slate-500">
              <Calendar className="w-4 h-4" />
              Last 10 Quizzes
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#4f46e5" stopOpacity={0.1} />
                    <stop offset="95%" stopColor="#4f46e5" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis
                  dataKey="index"
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: '#94a3b8', fontSize: 12 }}
                  dy={10}
                  tickFormatter={(value) => `Q${value}`}
                />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                <Tooltip
                  formatter={(value, _name, payload) => {
                    if (!payload?.payload) return [value, 'Marks'];
                    return [payload.payload.scoreLabel, 'Marks'];
                  }}
                  labelFormatter={(_label, payload) => {
                    const item = payload?.[0]?.payload;
                    return item ? `${item.topic}` : 'Quiz';
                  }}
                  contentStyle={{ backgroundColor: '#fff', borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  itemStyle={{ color: '#4f46e5', fontWeight: 'bold' }}
                />
                <Area type="monotone" dataKey="marksObtained" stroke="#4f46e5" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 p-8">
          <h3 className="text-xl font-bold text-slate-900 mb-6">Badges</h3>
          <div className="flex flex-wrap gap-2">
            {profile?.badges?.length ? (
              profile.badges.map((badge, i) => (
                <div key={i} className="rounded-full border border-green-200 bg-green-100 px-3 py-1 text-xs font-bold text-green-700">
                  {badge}
                </div>
              ))
            ) : (
              <div className="rounded-2xl bg-slate-50 p-4 text-sm text-slate-500">No badges earned yet.</div>
            )}
          </div>
        </motion.div>
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-indigo-100">
        <div className="mb-6 flex items-center justify-between">
          <h3 className="text-xl font-bold text-slate-900">Last 10 Quizzes</h3>
          <span className="text-sm font-medium text-slate-500">Topics with marks from your most recent attempts</span>
        </div>

        <div className="space-y-4">
          {results.length > 0 ? (
            results.map((res) => (
              <div key={res.id} className="rounded-3xl border border-slate-100 bg-slate-50 p-5 transition hover:border-indigo-100 hover:bg-white">
                <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
                      {new Date(res.createdAt).toLocaleDateString()}
                    </p>
                    <h4 className="mt-1 text-xl font-bold text-slate-900">{res.topic || 'Quiz Attempt'}</h4>
                  </div>
                  <div className="rounded-2xl bg-indigo-50 px-4 py-2 text-sm font-bold text-indigo-600">
                    {`${Math.round(res.totalScore)}/${Math.round(res.maxScore)}`}
                  </div>
                </div>

                <div className="grid gap-3 sm:grid-cols-3">
                  <div className="rounded-2xl bg-emerald-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-emerald-600">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Attempted</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{res.attemptedCount ?? res.answers.length}</p>
                  </div>
                  <div className="rounded-2xl bg-amber-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-amber-600">
                      <CircleDashed className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Left</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{res.unattemptedCount ?? 0}</p>
                  </div>
                  <div className="rounded-2xl bg-sky-50 p-4">
                    <div className="mb-2 flex items-center gap-2 text-sky-600">
                      <Bookmark className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wider">Attempt Later</span>
                    </div>
                    <p className="text-2xl font-bold text-slate-900">{res.markedForLaterCount ?? 0}</p>
                  </div>
                </div>

                <div className="mt-6 border-t border-slate-200/60 pt-4">
                  <button 
                    onClick={() => setExpandedQuizId(expandedQuizId === res.id ? null : res.id)}
                    className="flex items-center gap-2 text-sm font-bold text-indigo-600 hover:text-indigo-700 transition-colors"
                  >
                    <Sparkles className="h-4 w-4" />
                    {expandedQuizId === res.id ? 'Hide AI Insights' : 'View AI Insights'}
                  </button>

                  {expandedQuizId === res.id && (
                    <motion.div 
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="mt-4 space-y-4"
                    >
                      {res.aiFeedback && (
                        <div className="rounded-2xl bg-indigo-50/50 p-4 border border-indigo-100">
                          <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-wrap">{res.aiFeedback}</p>
                        </div>
                      )}
                      
                      <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-emerald-600 px-1">Strengths</h5>
                          <ul className="space-y-1">
                            {res.strengths.map((s, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-white/50 p-2 rounded-xl border border-slate-100">
                                <span className="text-emerald-500 mt-1">•</span> {s}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <div className="space-y-2">
                          <h5 className="text-xs font-bold uppercase tracking-wider text-rose-600 px-1">Weaknesses</h5>
                          <ul className="space-y-1">
                            {res.weaknesses.map((w, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-slate-600 bg-white/50 p-2 rounded-xl border border-slate-100">
                                <span className="text-rose-500 mt-1">•</span> {w}
                              </li>
                            ))}
                          </ul>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <h5 className="text-xs font-bold uppercase tracking-wider text-indigo-600 px-1">Suggestions</h5>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {res.suggestions.map((s, i) => (
                            <div key={i} className="text-sm text-slate-600 bg-indigo-50/30 p-3 rounded-xl border border-indigo-100/50">
                              {s}
                            </div>
                          ))}
                        </div>
                      </div>
                    </motion.div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="py-12 text-center">
              <Sparkles className="mx-auto mb-4 h-8 w-8 text-slate-200" />
              <p className="font-medium text-slate-400">No quizzes taken yet.</p>
            </div>
          )}
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="rounded-3xl bg-indigo-900 p-8 text-white shadow-2xl sm:p-12">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-white/10 p-2 backdrop-blur-md">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold">Recommended for You</h3>
        </div>
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {results.length > 0 && results[0].suggestions.slice(0, 3).map((suggestion, i) => (
            <div key={i} className="cursor-pointer rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur-md transition-all hover:bg-white/10">
              <p className="mb-4 text-lg font-medium leading-relaxed">{suggestion}</p>
              <div className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-indigo-300">
                Start Review <ChevronRight className="h-4 w-4" />
              </div>
            </div>
          ))}
          {results.length === 0 && (
            <div className="col-span-full py-8 text-center">
              <p className="text-lg text-white/60">Take your first quiz to get personalized recommendations!</p>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
