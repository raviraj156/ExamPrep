import { Answer, PerformanceModel, Quiz, QuizResult, TopicPerformance } from '../types';
import { predictSummaryLabels } from './trainedSummaryModel';

const MODEL_VERSION = 1;

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function rollingAverage(previousAverage: number, previousCount: number, nextValue: number) {
  return previousAverage + (nextValue - previousAverage) / (previousCount + 1);
}

function buildQuestionMap(quiz: Quiz) {
  return new Map(quiz.questions.map((question) => [question.id, question]));
}

function getQuestionMetrics(quiz: Quiz, answers: Answer[]) {
  const questionMap = buildQuestionMap(quiz);

  let mcqTotal = 0;
  let mcqCorrect = 0;
  let subjectiveTotal = 0;
  let subjectiveScoreSum = 0;
  const normalizedMarks: number[] = [];

  for (const answer of answers) {
    const question = questionMap.get(answer.questionId);
    if (!question) continue;

    const weightage = question.weightage || (question.type === 'mcq' ? 1 : 5);
    const normalizedMark = weightage > 0 ? (answer.marksObtained || 0) / weightage : 0;
    normalizedMarks.push(clamp(normalizedMark, 0, 1));

    if (question.type === 'mcq') {
      mcqTotal += 1;
      if ((answer.score || 0) >= 1) mcqCorrect += 1;
      continue;
    }

    subjectiveTotal += 1;
    subjectiveScoreSum += clamp((answer.score || 0) / 10, 0, 1);
  }

  const mcqAccuracy = mcqTotal > 0 ? mcqCorrect / mcqTotal : 0;
  const subjectiveScore = subjectiveTotal > 0 ? subjectiveScoreSum / subjectiveTotal : 0;

  const mean = normalizedMarks.length > 0
    ? normalizedMarks.reduce((sum, value) => sum + value, 0) / normalizedMarks.length
    : 0;
  const variance = normalizedMarks.length > 0
    ? normalizedMarks.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / normalizedMarks.length
    : 0;
  const consistency = clamp(1 - Math.sqrt(variance), 0, 1);

  return {
    mcqAccuracy,
    subjectiveScore,
    consistency
  };
}

function normalizeTopic(topic: string) {
  return topic.trim().toLowerCase();
}

export function trainPerformanceModel(
  existingModel: PerformanceModel | null,
  result: QuizResult,
  quiz: Quiz
): PerformanceModel {
  const accuracy = result.maxScore > 0 ? clamp(result.totalScore / result.maxScore, 0, 1) : 0;
  const metrics = getQuestionMetrics(quiz, result.answers);
  const topicKey = normalizeTopic(result.topic || quiz.topic || 'general');

  const baseModel: PerformanceModel = existingModel || {
    version: MODEL_VERSION,
    totalAttempts: 0,
    overallAccuracy: 0,
    overallMcqAccuracy: 0,
    overallSubjectiveScore: 0,
    consistencyScore: 0,
    avgTimeSpent: 0,
    avgDifficulty: 0,
    topicPerformance: {},
    updatedAt: Date.now()
  };

  const previousAttempts = baseModel.totalAttempts;
  const nextAttempts = previousAttempts + 1;
  const previousTopic: TopicPerformance = baseModel.topicPerformance[topicKey] || {
    attempts: 0,
    avgAccuracy: 0,
    avgMcqAccuracy: 0,
    avgSubjectiveScore: 0,
    trend: 'stable'
  };

  const nextTopicAttempts = previousTopic.attempts + 1;
  const nextTopicAvgAccuracy = rollingAverage(previousTopic.avgAccuracy, previousTopic.attempts, accuracy);
  const nextTopicAvgMcqAccuracy = rollingAverage(previousTopic.avgMcqAccuracy, previousTopic.attempts, metrics.mcqAccuracy);
  const nextTopicAvgSubjectiveScore = rollingAverage(previousTopic.avgSubjectiveScore, previousTopic.attempts, metrics.subjectiveScore);

  const trendDelta = accuracy - previousTopic.avgAccuracy;
  const nextTopicTrend: TopicPerformance['trend'] =
    previousTopic.attempts === 0
      ? 'stable'
      : trendDelta > 0.08
      ? 'improving'
      : trendDelta < -0.08
      ? 'declining'
      : 'stable';

  return {
    version: MODEL_VERSION,
    totalAttempts: nextAttempts,
    overallAccuracy: rollingAverage(baseModel.overallAccuracy, previousAttempts, accuracy),
    overallMcqAccuracy: rollingAverage(baseModel.overallMcqAccuracy, previousAttempts, metrics.mcqAccuracy),
    overallSubjectiveScore: rollingAverage(baseModel.overallSubjectiveScore, previousAttempts, metrics.subjectiveScore),
    consistencyScore: rollingAverage(baseModel.consistencyScore, previousAttempts, metrics.consistency),
    avgTimeSpent: rollingAverage(baseModel.avgTimeSpent, previousAttempts, result.avgTimeSpent),
    avgDifficulty: rollingAverage(baseModel.avgDifficulty, previousAttempts, result.difficultyHandled),
    topicPerformance: {
      ...baseModel.topicPerformance,
      [topicKey]: {
        attempts: nextTopicAttempts,
        avgAccuracy: nextTopicAvgAccuracy,
        avgMcqAccuracy: nextTopicAvgMcqAccuracy,
        avgSubjectiveScore: nextTopicAvgSubjectiveScore,
        trend: nextTopicTrend
      }
    },
    updatedAt: Date.now()
  };
}

function toPercent(value: number) {
  return Math.round(clamp(value, 0, 1) * 100);
}

function buildSuggestions(accuracy: number, model: PerformanceModel, topicKey: string) {
  const topic = model.topicPerformance[topicKey];
  const suggestions: string[] = [];

  if (accuracy < 0.55) {
    suggestions.push('Revisit fundamentals first, then retry a short quiz on the same topic within 24 hours.');
  }

  if (model.overallMcqAccuracy < 0.65) {
    suggestions.push('Practice elimination strategy for MCQs: remove 2 weak options before selecting your final answer.');
  }

  if (model.overallSubjectiveScore < 0.65) {
    suggestions.push('For subjective answers, use a structure: definition, key points, and one example.');
  }

  if (model.consistencyScore < 0.7) {
    suggestions.push('Your performance varies across questions, so use timed mini-sets to improve consistency.');
  }

  if (topic?.trend === 'declining') {
    suggestions.push('Accuracy in this topic is dropping, so schedule a focused revision session before taking a harder quiz.');
  }

  if (suggestions.length < 3) {
    suggestions.push('Review incorrect questions and write one correction note per mistake.');
  }
  if (suggestions.length < 4) {
    suggestions.push('Take one mixed-difficulty quiz next to stabilize your retention and speed.');
  }

  return suggestions.slice(0, 5);
}

const adviceTagToSuggestion: Record<string, string> = {
  revise_fundamentals: 'Revisit AI fundamentals and core definitions before attempting the next mixed quiz.',
  practice_mcq: 'Do focused MCQ drills in AI topics and apply elimination before finalizing options.',
  practice_subjective: 'Structure subjective answers as concept, mechanism, and one practical AI example.',
  improve_consistency: 'Practice timed mini-sets to reduce performance variance across AI subtopics.',
  level_up_challenge: 'Move to higher-difficulty AI questions to convert momentum into advanced mastery.'
};

export function generateSummaryFromModel(
  model: PerformanceModel,
  result: QuizResult,
  quiz: Quiz
): Pick<QuizResult, 'strengths' | 'weaknesses' | 'aiFeedback' | 'suggestions'> {
  const accuracy = result.maxScore > 0 ? clamp(result.totalScore / result.maxScore, 0, 1) : 0;
  const topicKey = normalizeTopic(result.topic || quiz.topic || 'general');
  const topic = model.topicPerformance[topicKey];
  const predicted = predictSummaryLabels({
    overall_accuracy: model.overallAccuracy,
    mcq_accuracy: model.overallMcqAccuracy,
    subjective_score: model.overallSubjectiveScore,
    consistency: model.consistencyScore,
    attempted_ratio: result.answers.length > 0 ? clamp(result.attemptedCount / result.answers.length, 0, 1) : 0
  });

  const strengths: string[] = [];
  const weaknesses: string[] = [];

  if (accuracy >= 0.75) {
    strengths.push('Strong overall score in this quiz attempt.');
  } else if (accuracy <= 0.5) {
    weaknesses.push('Overall score is below target and needs reinforcement.');
  }

  if (model.overallMcqAccuracy >= 0.75) {
    strengths.push('Good MCQ decision-making accuracy.');
  } else if (model.overallMcqAccuracy > 0 && model.overallMcqAccuracy < 0.6) {
    weaknesses.push('MCQ accuracy is low; option elimination needs improvement.');
  }

  if (model.overallSubjectiveScore >= 0.72) {
    strengths.push('Subjective responses show good depth and clarity.');
  } else if (model.overallSubjectiveScore > 0 && model.overallSubjectiveScore < 0.6) {
    weaknesses.push('Subjective answers need better structure and completeness.');
  }

  if (model.consistencyScore >= 0.78) {
    strengths.push('Performance is consistent across different questions.');
  } else if (model.consistencyScore < 0.65) {
    weaknesses.push('Performance is inconsistent across questions.');
  }

  if (topic?.trend === 'improving') {
    strengths.push('You are improving in this topic compared to previous attempts.');
  } else if (topic?.trend === 'declining') {
    weaknesses.push('Recent trend in this topic is declining.');
  }

  if (strengths.length === 0) {
    strengths.push('You are attempting consistently, which is a strong learning behavior.');
  }

  if (weaknesses.length === 0) {
    weaknesses.push('No major weakness detected in this attempt; focus on speed and retention.');
  }

  const aiFeedback = [
    `Model-based performance summary: you scored ${toPercent(accuracy)}% in this quiz.`,
    `Predicted level in AI domain: ${predicted.level.toUpperCase()}.`,
    `Across ${model.totalAttempts} attempt(s), your average accuracy is ${toPercent(model.overallAccuracy)}% with consistency ${toPercent(model.consistencyScore)}%.`,
    topic
      ? `For "${result.topic}", trend is ${topic.trend} with topic accuracy ${toPercent(topic.avgAccuracy)}%.`
      : 'Topic-specific trend is still building; complete more quizzes for stronger personalization.'
  ].join('\n\n');

  const trainedSuggestions = predicted.adviceTags
    .map((tag) => adviceTagToSuggestion[tag])
    .filter(Boolean);

  const mergedSuggestions = Array.from(
    new Set([...trainedSuggestions, ...buildSuggestions(accuracy, model, topicKey)])
  ).slice(0, 5);

  return {
    strengths: strengths.slice(0, 4),
    weaknesses: weaknesses.slice(0, 4),
    aiFeedback,
    suggestions: mergedSuggestions
  };
}
