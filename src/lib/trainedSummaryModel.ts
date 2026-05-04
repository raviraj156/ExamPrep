import { trainedAiSummaryModel } from '../data/aiSummaryModel';

export type PerformanceLevel = 'beginner' | 'intermediate' | 'advanced';

export interface SummaryFeatures {
  overall_accuracy: number;
  mcq_accuracy: number;
  subjective_score: number;
  consistency: number;
  attempted_ratio: number;
}

export interface PredictedSummaryLabels {
  level: PerformanceLevel;
  adviceTags: string[];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

function distance(a: number[], b: number[]) {
  return Math.sqrt(a.reduce((sum, value, index) => sum + Math.pow(value - b[index], 2), 0));
}

function toVector(features: SummaryFeatures) {
  return trainedAiSummaryModel.featureOrder.map((key) => {
    const stats = trainedAiSummaryModel.featureStats[key];
    const rawValue = clamp(features[key as keyof SummaryFeatures], 0, 1);
    const std = stats.std > 0 ? stats.std : 1;
    return (rawValue - stats.mean) / std;
  });
}

export function predictSummaryLabels(features: SummaryFeatures): PredictedSummaryLabels {
  const vector = toVector(features);

  const levelOrder: PerformanceLevel[] = ['beginner', 'intermediate', 'advanced'];
  const level = levelOrder.reduce((best, candidate) => {
    const currentDistance = distance(vector, trainedAiSummaryModel.levelCentroids[candidate]);
    return currentDistance < best.dist ? { level: candidate, dist: currentDistance } : best;
  }, { level: 'intermediate' as PerformanceLevel, dist: Number.POSITIVE_INFINITY }).level;

  const rankedAdvice = Object.entries(trainedAiSummaryModel.adviceCentroids)
    .map(([tag, centroid]) => ({
      tag,
      dist: distance(vector, centroid),
      threshold: trainedAiSummaryModel.adviceThresholds[tag] ?? 1.4
    }))
    .filter((entry) => entry.dist <= entry.threshold)
    .sort((a, b) => a.dist - b.dist)
    .slice(0, 3)
    .map((entry) => entry.tag);

  const adviceTags = rankedAdvice.length > 0 ? rankedAdvice : ['revise_fundamentals'];

  return { level, adviceTags };
}
