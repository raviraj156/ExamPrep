import { GoogleGenAI, Type } from "@google/genai";
import { Difficulty, Question, Quiz, QuizResult, Answer, QuestionType } from "../types";

const geminiApiKey =
  import.meta.env.VITE_GEMINI_API_KEY;

const GENERATION_MODEL = "gemini-2.5-flash";

const ai = geminiApiKey ? new GoogleGenAI({ apiKey: geminiApiKey }) : null;

function getAiClient() {
  if (!ai) {
    throw new Error(
      "Gemini API key is missing. Set `VITE_GEMINI_API_KEY` in your environment."
    );
  }

  return ai;
}

export const generateQuiz = async (topic: string, difficulty: Difficulty, questionType: QuestionType = 'both'): Promise<Quiz> => {
  const model = GENERATION_MODEL;
  const typeInstruction = questionType === 'mcq' 
    ? "The quiz should contain ONLY multiple-choice questions (MCQ)."
    : questionType === 'subjective'
    ? "The quiz should contain ONLY short-answer (subjective) questions."
    : "The quiz should contain a mix of multiple-choice questions (MCQ) and short-answer (subjective) questions.";

  const prompt = `Generate a quiz on the topic: "${topic}" with difficulty level: "${difficulty}". 
  ${typeInstruction}
  Generate exactly 8 questions.
  For MCQs, provide 4 options and the correct answer.
  For subjective questions, provide a sample correct answer and an explanation.
  Assign a 'weightage' to each question: 1 for MCQs and 5 for subjective questions.
  Ensure the questions are challenging and relevant to the difficulty level.
  Return the response in JSON format.`;

  const response = await getAiClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          questions: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                type: { type: Type.STRING, enum: ["mcq", "subjective"] },
                question: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.STRING },
                explanation: { type: Type.STRING },
                weightage: { type: Type.NUMBER }
              },
              required: ["type", "question", "correctAnswer", "explanation", "weightage"]
            }
          }
        },
        required: ["questions"]
      }
    }
  });

  const data = JSON.parse(response.text);
  const questions: Question[] = data.questions.map((q: any, index: number) => ({
    ...q,
    id: `q-${index + 1}`
  }));

  return {
    id: `quiz-${Date.now()}`,
    topic,
    difficulty,
    questionType,
    questions,
    createdAt: Date.now()
  };
};

export const evaluateSubjectiveAnswer = async (question: string, correctAnswer: string, userAnswer: string): Promise<{ score: number; feedback: string }> => {
  const model = GENERATION_MODEL;
  const prompt = `Evaluate the following student answer for a subjective question.
  Question: "${question}"
  Correct Answer Reference: "${correctAnswer}"
  Student's Answer: "${userAnswer}"
  
  Provide a score from 0 to 10 (where 10 is perfect) and constructive feedback.
  Return the response in JSON format.`;

  const response = await getAiClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          score: { type: Type.NUMBER },
          feedback: { type: Type.STRING }
        },
        required: ["score", "feedback"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generatePerformanceAnalysis = async (quiz: Quiz, answers: Answer[]): Promise<Partial<QuizResult>> => {
  const model = GENERATION_MODEL;
  const quizData = JSON.stringify(quiz);
  const answersData = JSON.stringify(answers);

  const prompt = `Analyze the student's performance on this quiz.
  Quiz: ${quizData}
  Answers and Scores: ${answersData}
  
  Identify:
  1. Strengths (topics or question types they did well in)
  2. Weaknesses (areas for improvement)
  3. Overall AI feedback (encouraging and insightful)
  4. 3-5 Actionable suggestions for further study.
  
  Return the response in JSON format.`;

  const response = await getAiClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          strengths: { type: Type.ARRAY, items: { type: Type.STRING } },
          weaknesses: { type: Type.ARRAY, items: { type: Type.STRING } },
          aiFeedback: { type: Type.STRING },
          suggestions: { type: Type.ARRAY, items: { type: Type.STRING } }
        },
        required: ["strengths", "weaknesses", "aiFeedback", "suggestions"]
      }
    }
  });

  return JSON.parse(response.text);
};

export const generateFlashcards = async (topic: string): Promise<{ front: string; back: string }[]> => {
  const model = GENERATION_MODEL;
  const prompt = `Generate 10 educational flashcards for the topic: "${topic}".
  Each flashcard should have a 'front' (question or term) and a 'back' (answer or definition).
  Return the response in JSON format.`;

  const response = await getAiClient().models.generateContent({
    model,
    contents: prompt,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                front: { type: Type.STRING },
                back: { type: Type.STRING }
              },
              required: ["front", "back"]
            }
          }
        },
        required: ["flashcards"]
      }
    }
  });

  const data = JSON.parse(response.text);
  return data.flashcards;
};
