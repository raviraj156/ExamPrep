import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Difficulty, Quiz, QuestionType } from '../types';
import { generateQuiz } from '../lib/ai';
import { db, handleFirestoreError, isFirebaseConfigured, OperationType } from '../lib/firebase';
import { doc, setDoc } from 'firebase/firestore';
import { Brain, Sparkles, ArrowRight, Loader2, BookOpen, Eye, Flame } from 'lucide-react';

interface HomeProps {
  onStartQuiz: (quiz: Quiz) => void;
  streak?: number;
}

export default function Home({ onStartQuiz, streak = 0 }: HomeProps) {
  const [topic, setTopic] = useState('');
  const [difficulty, setDifficulty] = useState<Difficulty>('Medium');
  const [questionType, setQuestionType] = useState<QuestionType>('both');
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [generateFlashcards, setGenerateFlashcards] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topic.trim()) return;

    setIsGenerating(true);
    try {
      const quiz = await generateQuiz(topic, difficulty, questionType);
      quiz.isFocusMode = isFocusMode;
      quiz.generateFlashcards = generateFlashcards;

      if (isFirebaseConfigured && db) {
        try {
          await setDoc(doc(db, 'quizzes', quiz.id), quiz);
        } catch (error) {
          console.error('Failed to save quiz:', error);
          try {
            handleFirestoreError(error, OperationType.WRITE, `quizzes/${quiz.id}`);
          } catch (firestoreError) {
            console.error(firestoreError);
          }
        }
      } else {
        console.warn('Skipping quiz persistence because Firebase is not configured.');
      }

      onStartQuiz(quiz);
    } catch (error) {
      console.error('Error generating quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to generate quiz. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto pt-12">
      <div className="text-center mb-12">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-3 bg-indigo-100 rounded-2xl mb-6"
        >
          <Sparkles className="w-8 h-8 text-indigo-600" />
        </motion.div>
        <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
          What are we mastering <span className="text-indigo-600">today?</span>
        </h1>
        <p className="text-xl text-slate-600 max-w-2xl mx-auto mb-6">
          Enter any topic and our AI will craft a personalized exam-style quiz to test your knowledge.
        </p>

        {streak > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-full font-bold text-sm border border-orange-200"
          >
            <Flame className="w-4 h-4 fill-orange-500" />
            {streak} Day Study Streak!
          </motion.div>
        )}
      </div>

      <motion.div
        initial={{ y: 20, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl shadow-xl shadow-indigo-100 border border-slate-100 p-8 sm:p-12"
      >
        <form onSubmit={handleGenerate} className="space-y-8">
          <div>
            <label htmlFor="topic" className="block text-sm font-semibold text-slate-700 mb-2 uppercase tracking-wider">
              Topic or Subject
            </label>
            <select
              id="topic"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              className="w-full px-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-lg focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 transition-all outline-none appearance-none"
              required
            >
              <option value="" disabled>Select an AI Topic...</option>
              <option value="Machine Learning Basics">Machine Learning Basics</option>
              <option value="Deep Learning">Deep Learning</option>
              <option value="Natural Language Processing">Natural Language Processing</option>
              <option value="Computer Vision">Computer Vision</option>
              <option value="Generative AI">Generative AI</option>
              <option value="AI Ethics">AI Ethics</option>
              <option value="General AI">General AI</option>
            </select>
          </div>

          <div>
            <span className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
              Question Type
            </span>
            <div className="grid grid-cols-3 gap-4">
              {[
                { id: 'mcq', label: 'MCQs Only' },
                { id: 'subjective', label: 'Subjective' },
                { id: 'both', label: 'Mixed' }
              ].map((type) => (
                <button
                  key={type.id}
                  type="button"
                  onClick={() => setQuestionType(type.id as QuestionType)}
                  className={`py-3 rounded-xl font-bold transition-all border-2 text-sm ${
                    questionType === type.id
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  {type.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className="block text-sm font-semibold text-slate-700 mb-4 uppercase tracking-wider">
              Difficulty Level
            </span>
            <div className="grid grid-cols-3 gap-4">
              {(['Easy', 'Medium', 'Hard'] as Difficulty[]).map((level) => (
                <button
                  key={level}
                  type="button"
                  onClick={() => setDifficulty(level)}
                  className={`py-3 rounded-xl font-bold transition-all border-2 text-sm ${
                    difficulty === level
                      ? 'bg-indigo-600 border-indigo-600 text-white shadow-md'
                      : 'bg-white border-slate-100 text-slate-600 hover:border-indigo-200'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <button
              type="button"
              onClick={() => setIsFocusMode(!isFocusMode)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                isFocusMode ? 'border-indigo-500 bg-indigo-50' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Eye className={`w-5 h-5 ${isFocusMode ? 'text-indigo-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">Focus Mode</p>
                  <p className="text-xs text-slate-500">Distraction-free UI</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${isFocusMode ? 'bg-indigo-600' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${isFocusMode ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>

            <button
              type="button"
              onClick={() => setGenerateFlashcards(!generateFlashcards)}
              className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                generateFlashcards ? 'border-purple-500 bg-purple-50' : 'border-slate-100 bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <BookOpen className={`w-5 h-5 ${generateFlashcards ? 'text-purple-600' : 'text-slate-400'}`} />
                <div className="text-left">
                  <p className="font-bold text-slate-900 text-sm">AI Flashcards</p>
                  <p className="text-xs text-slate-500">Auto-generate cards</p>
                </div>
              </div>
              <div className={`w-10 h-6 rounded-full p-1 transition-colors ${generateFlashcards ? 'bg-purple-600' : 'bg-slate-300'}`}>
                <div className={`w-4 h-4 bg-white rounded-full transition-transform ${generateFlashcards ? 'translate-x-4' : 'translate-x-0'}`} />
              </div>
            </button>
          </div>

          <button
            type="submit"
            disabled={isGenerating || !topic.trim()}
            className="w-full py-5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-2xl font-bold text-xl shadow-xl shadow-indigo-200 hover:shadow-indigo-300 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 group"
          >
            {isGenerating ? (
              <>
                <Loader2 className="w-6 h-6 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                Start Preparation
                <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
              </>
            )}
          </button>
        </form>
      </motion.div>

      <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-8">
        {[
          { icon: Brain, title: 'Smart Evaluation', desc: 'AI analyzes your subjective answers with detailed feedback.' },
          { icon: Sparkles, title: 'Adaptive Learning', desc: 'Quizzes tailored to your specific topic and difficulty.' },
          { icon: Sparkles, title: 'Progress Tracking', desc: 'Visualize your growth over time with our dashboard.' }
        ].map((feature, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.1 }}
            className="p-6 bg-white rounded-2xl border border-slate-100 shadow-sm"
          >
            <div className="w-12 h-12 bg-indigo-50 rounded-xl flex items-center justify-center mb-4">
              <feature.icon className="w-6 h-6 text-indigo-600" />
            </div>
            <h3 className="font-bold text-slate-900 mb-2">{feature.title}</h3>
            <p className="text-slate-600 text-sm leading-relaxed">{feature.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
