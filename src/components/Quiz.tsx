import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Quiz, Answer, QuizResult, UserProfile, PerformanceModel } from '../types';
import {
  ChevronRight,
  ChevronLeft,
  Send,
  Loader2,
  Timer,
  Brain,
  Mic,
  MicOff,
  BookOpen,
  EyeOff,
  Bookmark,
  BookmarkCheck,
  LogOut,
  TriangleAlert,
  X
} from 'lucide-react';
import { evaluateSubjectiveAnswer, generateFlashcards as apiGenerateFlashcards } from '../lib/ai';
import { generateSummaryFromModel, trainPerformanceModel } from '../lib/performanceModel';
import { auth, db, handleFirestoreError, isFirebaseConfigured, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc, getDoc } from 'firebase/firestore';

interface QuizProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onQuit: () => void;
}

export default function QuizPage({ quiz, onComplete, onQuit }: QuizProps) {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [userAnswers, setUserAnswers] = useState<Record<string, string>>({});
  const [markedForLater, setMarkedForLater] = useState<Record<string, boolean>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(quiz.questions.length * 60);
  const [isListening, setIsListening] = useState(false);
  const [flashcards, setFlashcards] = useState<{ front: string; back: string }[]>([]);
  const [showFlashcards, setShowFlashcards] = useState(false);
  const [isGeneratingFlashcards, setIsGeneratingFlashcards] = useState(false);
  const [showQuitConfirm, setShowQuitConfirm] = useState(false);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [timeSpentMap, setTimeSpentMap] = useState<Record<string, number>>({});
  const flashcardsRequestedRef = useRef(false);

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;

  const isAnswered = (questionId: string) => {
    const answer = userAnswers[questionId];
    return Boolean(answer && answer.trim().length > 0);
  };

  const attemptedCount = quiz.questions.filter((question) => isAnswered(question.id)).length;
  const markedForLaterCount = Object.values(markedForLater).filter(Boolean).length;
  const remainingCount = quiz.questions.length - attemptedCount;
  const currentQuestionMarked = Boolean(markedForLater[currentQuestion.id]);

  useEffect(() => {
    if (quiz.generateFlashcards && !flashcardsRequestedRef.current) {
      flashcardsRequestedRef.current = true;
      handleGenerateFlashcards();
    }
  }, [quiz.generateFlashcards, quiz.topic]);

  const handleGenerateFlashcards = async () => {
    setIsGeneratingFlashcards(true);
    try {
      const cards = await apiGenerateFlashcards(quiz.topic);
      setFlashcards(cards);
    } catch (error) {
      console.error('Error generating flashcards:', error);
    } finally {
      setIsGeneratingFlashcards(false);
    }
  };

  const startListening = () => {
    const speechWindow = window as Window & {
      SpeechRecognition?: new () => SpeechRecognition;
      webkitSpeechRecognition?: new () => SpeechRecognition;
    };
    const SpeechRecognitionCtor = speechWindow.SpeechRecognition || speechWindow.webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      alert('Speech recognition is not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = false;
    recognition.interimResults = false;
    recognition.lang = 'en-US';

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      const transcript = event.results[0][0].transcript.trim();
      const previous = userAnswers[currentQuestion.id] || '';
      handleAnswerChange([previous, transcript].filter(Boolean).join(' ').trim());
    };

    recognition.start();
  };

  useEffect(() => {
    if (timeLeft <= 0) {
      handleSubmit();
      return;
    }

    const timer = window.setInterval(() => {
      setTimeLeft((prev) => prev - 1);
    }, 1000);

    return () => window.clearInterval(timer);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (answer: string) => {
    setUserAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: answer
    }));
  };

  const toggleAttemptLater = () => {
    setMarkedForLater((prev) => ({
      ...prev,
      [currentQuestion.id]: !prev[currentQuestion.id]
    }));
  };

  const goToNextQuestion = () => {
    if (!isLastQuestion) {
      const now = Date.now();
      const elapsed = Math.round((now - questionStartTime) / 1000);
      setTimeSpentMap(prev => ({
        ...prev,
        [currentQuestion.id]: (prev[currentQuestion.id] || 0) + elapsed
      }));
      setQuestionStartTime(now);
      setCurrentQuestionIndex((prev) => prev + 1);
    }
  };

  const handleMarkAndContinue = () => {
    setMarkedForLater((prev) => ({
      ...prev,
      [currentQuestion.id]: true
    }));
    goToNextQuestion();
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const now = Date.now();
    const elapsed = Math.round((now - questionStartTime) / 1000);
    const finalTimeSpentMap = {
      ...timeSpentMap,
      [currentQuestion.id]: (timeSpentMap[currentQuestion.id] || 0) + elapsed
    };

    try {
      const evaluatedAnswers: Answer[] = [];
      let totalScore = 0;
      let correctCount = 0;
      let maxScore = 0;

      for (const question of quiz.questions) {
        const userAnswer = userAnswers[question.id] || '';
        const weightage = question.weightage || (question.type === 'mcq' ? 1 : 5);
        maxScore += weightage;

        if (question.type === 'mcq') {
          const isCorrect = userAnswer === question.correctAnswer;
          const score = isCorrect ? 1 : 0;
          const marksObtained = score * weightage;
          totalScore += marksObtained;
          if (isCorrect) correctCount++;

          evaluatedAnswers.push({
            questionId: question.id,
            userAnswer,
            score,
            marksObtained,
            timeSpent: finalTimeSpentMap[question.id] || 0
          });
        } else {
          const evaluation = await evaluateSubjectiveAnswer(
            question.question,
            question.correctAnswer,
            userAnswer
          );
          const marksObtained = (evaluation.score / 10) * weightage;
          totalScore += marksObtained;
          if (evaluation.score >= 7) correctCount++;

          evaluatedAnswers.push({
            questionId: question.id,
            userAnswer,
            score: evaluation.score,
            marksObtained,
            feedback: evaluation.feedback,
            timeSpent: finalTimeSpentMap[question.id] || 0
          });
        }
      }

      const currentTopicMetrics: Record<string, { total: number, score: number }> = {};
      quiz.questions.forEach((q, idx) => {
        const subtopic = q.aiSubtopic || 'general';
        const answer = evaluatedAnswers[idx];
        if (!currentTopicMetrics[subtopic]) {
          currentTopicMetrics[subtopic] = { total: 0, score: 0 };
        }
        const weightage = q.weightage || (q.type === 'mcq' ? 1 : 5);
        currentTopicMetrics[subtopic].total += weightage;
        currentTopicMetrics[subtopic].score += answer.marksObtained || 0;
      });

      const currentTopicScores = Object.entries(currentTopicMetrics).reduce((acc, [topic, data]) => {
        acc[topic] = data.total > 0 ? data.score / data.total : 0;
        return acc;
      }, {} as Record<string, number>);

      const baseResult: QuizResult = {
        id: `res-${Date.now()}`,
        quizId: quiz.id,
        userId: auth.currentUser?.uid || 'anonymous',
        topic: quiz.topic,
        answers: evaluatedAnswers,
        totalScore,
        correctCount,
        maxScore,
        attemptedCount,
        unattemptedCount: remainingCount,
        markedForLaterCount,
        strengths: [],
        weaknesses: [],
        aiFeedback: '',
        suggestions: [],
        avgTimeSpent: Object.values(finalTimeSpentMap).reduce((a, b) => a + b, 0) / quiz.questions.length,
        difficultyHandled: quiz.difficulty === 'Easy' ? 1 : quiz.difficulty === 'Medium' ? 2 : 3,
        createdAt: Date.now()
      };

      let trainedModel: PerformanceModel | null = null;
      if (isFirebaseConfigured && auth.currentUser && db) {
        try {
          const modelRef = doc(db, 'performanceModels', auth.currentUser.uid);
          const modelDoc = await getDoc(modelRef);
          const existingModel = modelDoc.exists() ? (modelDoc.data() as PerformanceModel) : null;
          trainedModel = trainPerformanceModel(existingModel, baseResult, quiz);
        } catch (error) {
          console.error('Failed to load existing performance model. Falling back to fresh model:', error);
        }
      }

      if (!trainedModel) {
        trainedModel = trainPerformanceModel(null, baseResult, quiz);
      }

      let analysis;
      try {
        const attempted_ratio = baseResult.answers.length > 0 ? (baseResult.attemptedCount / baseResult.answers.length) : 0;
        const response = await fetch('http://localhost:5000/api/summary', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            overall_accuracy: baseResult.maxScore > 0 ? (baseResult.totalScore / baseResult.maxScore) : 0,
            mcq_accuracy: currentTopicScores.general !== undefined ? currentTopicScores.general : (baseResult.correctCount / quiz.questions.length), // Fallback to a rough estimate
            subjective_score: baseResult.answers.filter(a => a.feedback).reduce((acc, a) => acc + (a.score || 0), 0) / (baseResult.answers.filter(a => a.feedback).length || 1) / 10,
            consistency: 1 - Math.sqrt(baseResult.answers.reduce((acc, a) => acc + Math.pow(((a.marksObtained || 0) / (a.marksObtained ? 1 : 1)) - 0.5, 2), 0) / baseResult.answers.length), // Rough local consistency
            attempted_ratio,
            avg_time_spent: baseResult.avgTimeSpent,
            avg_difficulty: baseResult.difficultyHandled,
            topic_performance: trainedModel.topicPerformance,
            current_topic_scores: currentTopicScores
          })
        });
        
        if (!response.ok) throw new Error('Python backend error');
        analysis = await response.json();
      } catch (error) {
        console.warn('Failed to reach Python backend, falling back to local TS model:', error);
        analysis = generateSummaryFromModel(trainedModel, baseResult, quiz);
      }

      const result: QuizResult = {
        ...baseResult,
        strengths: analysis.strengths,
        weaknesses: analysis.weaknesses,
        aiFeedback: analysis.aiFeedback,
        suggestions: analysis.suggestions
      };

      if (isFirebaseConfigured && auth.currentUser) {
        try {
          await setDoc(doc(db, 'results', result.id), result);
          await setDoc(doc(db, 'performanceModels', auth.currentUser.uid), trainedModel);

          const userRef = doc(db, 'users', auth.currentUser.uid);
          const userDoc = await getDoc(userRef);
          const userData = userDoc.exists() ? (userDoc.data() as UserProfile) : null;

          const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0;
          const newBadges = [...(userData?.badges || [])];
          if (percentage >= 90 && !newBadges.includes('Master')) {
            newBadges.push('Master');
          }
          if (!newBadges.includes('First Step')) {
            newBadges.push('First Step');
          }

          const now = new Date();
          const lastStudyDate = userData?.lastStudyDate ? new Date(userData.lastStudyDate) : null;
          const todayKey = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
          const lastKey = lastStudyDate
            ? new Date(lastStudyDate.getFullYear(), lastStudyDate.getMonth(), lastStudyDate.getDate()).getTime()
            : null;
          const oneDayMs = 24 * 60 * 60 * 1000;

          let nextStreak = userData?.streak || 0;
          if (lastKey === null) {
            nextStreak = 1;
          } else if (lastKey === todayKey) {
            nextStreak = userData?.streak || 1;
          } else if (todayKey - lastKey === oneDayMs) {
            nextStreak = (userData?.streak || 0) + 1;
          } else {
            nextStreak = 1;
          }

          await updateDoc(userRef, {
            lastStudyDate: Date.now(),
            streak: nextStreak,
            badges: newBadges
          });
        } catch (error) {
          console.error('Failed to persist quiz result:', error);
          try {
            handleFirestoreError(error, OperationType.WRITE, `results/${result.id}`);
          } catch (firestoreError) {
            console.error(firestoreError);
          }
        }
      }

      onComplete(result);
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert(error instanceof Error ? error.message : 'Failed to evaluate quiz. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`mx-auto ${quiz.isFocusMode ? 'fixed inset-0 z-[100] overflow-y-auto bg-white p-6 sm:p-8' : 'max-w-5xl pt-8'}`}>
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100">
            <Brain className="h-6 w-6 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-slate-400">
              {quiz.isFocusMode ? 'Focus Session' : 'Live Quiz'}
            </p>
            <h1 className="text-2xl font-bold text-slate-900">{quiz.topic}</h1>
          </div>
        </div>

        <div className="flex items-center gap-3 self-start sm:self-auto">
          {quiz.isFocusMode && (
            <div className="rounded-full bg-slate-100 px-4 py-2 text-xs font-bold text-slate-500">
              Focus Mode Active
            </div>
          )}
          <button
            type="button"
            onClick={() => setShowQuitConfirm(true)}
            className="inline-flex items-center gap-2 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 font-semibold text-rose-600 transition hover:bg-rose-100"
          >
            <LogOut className="h-4 w-4" />
            Quit Test
          </button>
        </div>
      </div>

      {(flashcards.length > 0 || isGeneratingFlashcards) && (
        <div className="mb-6 flex justify-end">
          <button
            onClick={() => setShowFlashcards(!showFlashcards)}
            disabled={isGeneratingFlashcards}
            className="flex items-center gap-2 rounded-xl border border-purple-100 bg-purple-50 px-4 py-2 text-sm font-bold text-purple-600 transition-all hover:bg-purple-100 disabled:opacity-60"
          >
            <BookOpen className="h-4 w-4" />
            {isGeneratingFlashcards ? 'Generating Flashcards...' : showFlashcards ? 'Hide Flashcards' : 'Review Flashcards'}
          </button>
        </div>
      )}

      {showFlashcards && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="mb-8 grid grid-cols-1 gap-4 sm:grid-cols-2"
        >
          {flashcards.map((card, i) => (
            <div key={i} className="group cursor-pointer rounded-2xl border border-purple-100 bg-white p-4 shadow-sm transition-all hover:shadow-md">
              <p className="mb-2 text-xs font-bold uppercase text-purple-400">Flashcard {i + 1}</p>
              <p className="mb-2 font-bold text-slate-900">{card.front}</p>
              <p className="rounded-lg bg-purple-50 p-2 text-sm text-slate-600 opacity-0 transition-opacity group-hover:opacity-100">
                {card.back}
              </p>
            </div>
          ))}
        </motion.div>
      )}

      <div className="mb-8 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
        <div className="flex items-center justify-between rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
              <Timer className="h-6 w-6 text-indigo-600" />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Time Remaining</p>
              <p className={`text-xl font-mono font-bold ${timeLeft < 60 ? 'text-red-500' : 'text-slate-900'}`}>
                {formatTime(timeLeft)}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400">Progress</p>
            <p className="text-xl font-bold text-slate-900">
              {currentQuestionIndex + 1} <span className="text-slate-300">/</span> {quiz.questions.length}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3 rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
          <div className="rounded-2xl bg-emerald-50 p-3 text-center">
            <p className="text-2xl font-bold text-emerald-600">{attemptedCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-emerald-700">Attempted</p>
          </div>
          <div className="rounded-2xl bg-amber-50 p-3 text-center">
            <p className="text-2xl font-bold text-amber-600">{remainingCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-amber-700">Left</p>
          </div>
          <div className="rounded-2xl bg-sky-50 p-3 text-center">
            <p className="text-2xl font-bold text-sky-600">{markedForLaterCount}</p>
            <p className="text-xs font-bold uppercase tracking-wider text-sky-700">Later</p>
          </div>
        </div>
      </div>

      <div className="mb-12 h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${((currentQuestionIndex + 1) / quiz.questions.length) * 100}%` }}
          className="h-full bg-indigo-600"
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
          className="mb-8 rounded-3xl border border-slate-100 bg-white p-8 shadow-xl shadow-indigo-100 sm:p-12"
        >
          <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
            <div>
              <span className="mb-4 inline-block rounded-lg bg-indigo-50 px-3 py-1 text-xs font-bold uppercase tracking-wider text-indigo-600">
                {currentQuestion.type === 'mcq' ? 'Multiple Choice' : 'Short Answer'}
              </span>
              <h2 className="text-2xl font-bold leading-tight text-slate-900">
                {currentQuestion.question}
              </h2>
            </div>

            <button
              type="button"
              onClick={toggleAttemptLater}
              className={`inline-flex items-center gap-2 rounded-2xl px-4 py-3 font-semibold transition ${
                currentQuestionMarked
                  ? 'bg-sky-100 text-sky-700'
                  : 'border border-slate-200 bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {currentQuestionMarked ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
              {currentQuestionMarked ? 'Marked For Later' : 'Attempt Later'}
            </button>
          </div>

          <div className="space-y-4">
            {currentQuestion.type === 'mcq' ? (
              <div className="grid grid-cols-1 gap-4">
                {currentQuestion.options?.map((option, i) => (
                  <button
                    key={i}
                    onClick={() => handleAnswerChange(option)}
                    className={`rounded-2xl border-2 p-5 text-left font-medium transition-all ${
                      userAnswers[currentQuestion.id] === option
                        ? 'border-indigo-600 bg-indigo-600 text-white shadow-lg shadow-indigo-200'
                        : 'border-slate-100 bg-slate-50 text-slate-700 hover:border-indigo-200 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="mr-4 inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-sm font-bold">
                      {String.fromCharCode(65 + i)}
                    </span>
                    {option}
                  </button>
                ))}
              </div>
            ) : (
              <div className="relative">
                <textarea
                  value={userAnswers[currentQuestion.id] || ''}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                  placeholder="Type your answer here..."
                  rows={6}
                  className="w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 p-6 text-lg outline-none transition-all focus:border-indigo-500 focus:ring-4 focus:ring-indigo-100"
                />
                <button
                  type="button"
                  onClick={startListening}
                  className={`absolute bottom-4 right-4 rounded-full p-3 transition-all ${
                    isListening ? 'animate-pulse bg-red-500 text-white' : 'bg-indigo-100 text-indigo-600 hover:bg-indigo-200'
                  }`}
                >
                  {isListening ? <MicOff className="h-5 w-5" /> : <Mic className="h-5 w-5" />}
                </button>
              </div>
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <button
          onClick={() => setCurrentQuestionIndex((prev) => prev - 1)}
          disabled={currentQuestionIndex === 0 || isSubmitting}
          className="inline-flex items-center gap-2 rounded-xl px-6 py-3 font-bold text-slate-600 transition-all hover:bg-slate-100 disabled:opacity-30"
        >
          <ChevronLeft className="h-5 w-5" />
          Previous
        </button>

        <div className="flex flex-col gap-3 sm:flex-row">
          {!isLastQuestion && (
            <button
              type="button"
              onClick={handleMarkAndContinue}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-sky-200 bg-sky-50 px-6 py-4 font-bold text-sky-700 transition-all hover:bg-sky-100 disabled:opacity-50"
            >
              <Bookmark className="h-5 w-5" />
              Attempt Later
            </button>
          )}

          {isLastQuestion ? (
            <button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Evaluating...
                </>
              ) : (
                <>
                  Submit Quiz
                  <Send className="h-5 w-5" />
                </>
              )}
            </button>
          ) : (
            <button
              onClick={goToNextQuestion}
              disabled={isSubmitting}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-8 py-4 font-bold text-white shadow-xl shadow-indigo-200 transition-all hover:bg-indigo-700"
            >
              Next Question
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>

      {showQuitConfirm && (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl"
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="rounded-2xl bg-rose-100 p-3 text-rose-600">
                  <TriangleAlert className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-slate-900">End Test?</h3>
                  <p className="text-sm text-slate-500">Your current progress will be lost if you quit now.</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowQuitConfirm(false)}
                className="rounded-full p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-6 rounded-2xl bg-slate-50 p-4 text-sm text-slate-600">
              Attempted: <span className="font-semibold text-slate-900">{attemptedCount}</span> | Left: <span className="font-semibold text-slate-900">{remainingCount}</span> | Marked for later: <span className="font-semibold text-slate-900">{markedForLaterCount}</span>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => setShowQuitConfirm(false)}
                className="rounded-2xl bg-slate-100 px-5 py-3 font-semibold text-slate-700 transition hover:bg-slate-200"
              >
                Continue Test
              </button>
              <button
                type="button"
                onClick={onQuit}
                className="rounded-2xl bg-rose-600 px-5 py-3 font-semibold text-white transition hover:bg-rose-700"
              >
                End Test
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {isSubmitting && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="fixed inset-0 z-[130] flex flex-col items-center justify-center bg-white/80 p-8 text-center backdrop-blur-sm"
        >
          <div className="max-w-md">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              className="mb-8"
            >
              <Brain className="h-20 w-20 text-indigo-600" />
            </motion.div>
            <h2 className="mb-4 text-3xl font-bold text-slate-900">AI is evaluating your answers...</h2>
            <p className="mb-8 text-lg text-slate-600">
              This takes a moment as our AI carefully analyzes your responses to provide detailed feedback and scoring.
            </p>
            <div className="flex items-center justify-center gap-2 font-medium text-indigo-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span>Analyzing performance patterns...</span>
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}
