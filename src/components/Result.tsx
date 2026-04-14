import React from 'react';
import { motion } from 'motion/react';
import { QuizResult } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Label } from 'recharts';
import { CheckCircle2, XCircle, Sparkles, Target, Lightbulb, ArrowRight, Home, AlertCircle } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ResultProps {
  result: QuizResult;
  onGoHome: () => void;
}

export default function Result({ result, onGoHome }: ResultProps) {
  const percentage = Math.round((result.totalScore / result.maxScore) * 100);
  
  const data = [
    { name: 'Score', value: result.totalScore },
    { name: 'Remaining', value: Math.max(0, result.maxScore - result.totalScore) }
  ];

  const COLORS = ['#4f46e5', '#f1f5f9'];

  return (
    <div className="max-w-5xl mx-auto pt-8 pb-20">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center justify-center p-3 bg-green-100 rounded-2xl mb-6"
        >
          <CheckCircle2 className="w-8 h-8 text-green-600" />
        </motion.div>
        <h1 className="text-4xl font-extrabold text-slate-900 mb-4 tracking-tight">
          Quiz <span className="text-indigo-600">Completed!</span>
        </h1>
        <p className="text-xl text-slate-600">Great job! Here's how you performed.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-12">
        {/* Score Visualization */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1 bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 p-8 flex flex-col items-center justify-center"
        >
          <h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-8">Overall Score</h3>
          <div className="relative w-full aspect-square max-w-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={data}
                  cx="50%"
                  cy="50%"
                  innerRadius={70}
                  outerRadius={90}
                  paddingAngle={5}
                  dataKey="value"
                  startAngle={90}
                  endAngle={450}
                >
                  {data.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                  ))}
                  <Label
                    value={`${percentage}%`}
                    position="center"
                    className="text-4xl font-bold fill-slate-900"
                  />
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-8 text-center grid grid-cols-2 gap-4 w-full">
            <div className="p-4 bg-indigo-50 rounded-2xl border border-indigo-100">
              <p className="text-2xl font-bold text-indigo-600">
                {Math.round(result.totalScore)}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Total Marks</p>
            </div>
            <div className="p-4 bg-purple-50 rounded-2xl border border-purple-100">
              <p className="text-2xl font-bold text-purple-600">
                {result.correctCount || 0}
              </p>
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Correct Ans</p>
            </div>
          </div>
          <div className="mt-4 text-center">
            <p className="text-slate-500 font-medium text-sm">Out of {result.maxScore} Max Points</p>
          </div>
        </motion.div>

        {/* AI Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2 bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-indigo-50 rounded-xl">
              <Sparkles className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">AI Performance Analysis</h3>
          </div>
          <div className="prose prose-slate max-w-none">
            <ReactMarkdown>{result.aiFeedback}</ReactMarkdown>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        {/* Strengths & Weaknesses */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-50 rounded-xl">
              <Target className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Strengths</h3>
          </div>
          <ul className="space-y-4">
            {result.strengths.map((strength, i) => (
              <li key={i} className="flex items-start gap-3 p-4 bg-green-50/50 rounded-2xl border border-green-100">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 shrink-0" />
                <span className="text-slate-700 font-medium">{strength}</span>
              </li>
            ))}
          </ul>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 p-8"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-50 rounded-xl">
              <AlertCircle className="w-6 h-6 text-orange-600" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">Areas for Improvement</h3>
          </div>
          <ul className="space-y-4">
            {result.weaknesses.map((weakness, i) => (
              <li key={i} className="flex items-start gap-3 p-4 bg-orange-50/50 rounded-2xl border border-orange-100">
                <XCircle className="w-5 h-5 text-orange-600 mt-0.5 shrink-0" />
                <span className="text-slate-700 font-medium">{weakness}</span>
              </li>
            ))}
          </ul>
        </motion.div>
      </div>

      {/* Suggestions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-3xl shadow-2xl p-8 sm:p-12 text-white mb-12"
      >
        <div className="flex items-center gap-3 mb-8">
          <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <h3 className="text-2xl font-bold">Actionable Suggestions</h3>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {result.suggestions.map((suggestion, i) => (
            <div key={i} className="p-6 bg-white/10 backdrop-blur-md rounded-2xl border border-white/20 flex items-start gap-4">
              <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center shrink-0 font-bold">
                {i + 1}
              </div>
              <p className="text-lg font-medium leading-relaxed">{suggestion}</p>
            </div>
          ))}
        </div>
      </motion.div>

      <div className="flex justify-center">
        <button
          onClick={onGoHome}
          className="flex items-center gap-2 px-12 py-5 bg-white text-indigo-600 font-bold rounded-2xl shadow-xl shadow-indigo-100 hover:bg-indigo-50 transition-all border border-indigo-100"
        >
          <Home className="w-6 h-6" />
          Back to Home
          <ArrowRight className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
}
