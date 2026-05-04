import { Difficulty, Question, Quiz, QuizResult, Answer, QuestionType } from "../types";

const groqApiKey = import.meta.env.VITE_GROQ_API_KEY;
const GENERATION_MODEL = "llama-3.3-70b-versatile";

async function groqRequest(prompt: string, jsonMode: boolean = true) {
  if (!groqApiKey) {
    throw new Error("Groq API key is missing. Set `VITE_GROQ_API_KEY` in your environment.");
  }

  const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${groqApiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: GENERATION_MODEL,
      messages: [{ role: "user", content: prompt }],
      response_format: jsonMode ? { type: "json_object" } : undefined,
      temperature: 0.7
    })
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || "Groq API error");
  }

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

export const generateQuiz = async (topic: string, difficulty: Difficulty, questionType: QuestionType = 'both'): Promise<Quiz> => {
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
  For subjective questions, provide a sample correct answer and an explanation.
  Assign a specific 'aiSubtopic' (concept name) to each question that describes the exact core topic being tested (e.g., "Backpropagation", "Gradient Descent", "LSTMs", "Data Normalization"). This should be very granular.
  Assign a 'weightage' to each question: 1 for MCQs and 5 for subjective questions.
  Ensure the questions are challenging and relevant to the difficulty level.
  Return the response in JSON format with a root key "questions" which is an array of question objects.
  Each question object must have: type ("mcq" or "subjective"), question, options (for mcq), correctAnswer, explanation, aiSubtopic, weightage.`;

  const data = await groqRequest(prompt);
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
  const prompt = `Evaluate the following student answer for a subjective question.
  Question: "${question}"
  Correct Answer Reference: "${correctAnswer}"
  Student's Answer: "${userAnswer}"
  
  Provide a score from 0 to 10 (where 10 is perfect) and constructive feedback.
  Return the response in JSON format with keys "score" and "feedback".`;

  return await groqRequest(prompt);
};

export const generatePerformanceAnalysis = async (quiz: Quiz, answers: Answer[]): Promise<Partial<QuizResult>> => {
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
  
  Return the response in JSON format with keys: "strengths" (array), "weaknesses" (array), "aiFeedback" (string), "suggestions" (array).`;

  return await groqRequest(prompt);
};

export const generateFlashcards = async (topic: string): Promise<{ front: string; back: string }[]> => {
  const prompt = `Generate 10 educational flashcards for the topic: "${topic}".
  Each flashcard should have a 'front' (question or term) and a 'back' (answer or definition).
  Return the response in JSON format with a root key "flashcards" which is an array.`;

  const data = await groqRequest(prompt);
  return data.flashcards;
};
