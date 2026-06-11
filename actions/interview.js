"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

export async function generateQuiz() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      industry: true,
      skills: true,
    },
  });

  if (!user) throw new Error("User not found");

  const prompt = `
    Generate 10 COMPLETELY DIFFERENT technical interview questions for a ${
      user.industry
    } professional${
    user.skills?.length ? ` with expertise in ${user.skills.join(", ")}` : ""
  }.

    CRITICAL REQUIREMENTS:
    - Each question MUST cover a completely different topic or concept
    - Do NOT repeat similar questions
    - Do NOT ask variations of the same question
    - Cover diverse areas: basics, advanced concepts, real-world scenarios, troubleshooting, design, performance, security, best practices, tools, and methodologies
    - Each question must be unique in topic AND wording
    - Each question must have 4 distinct, non-overlapping options

    Return the response in this JSON format only, and do not include any additional text:
    {
      "questions": [
        {
          "question": "string",
          "options": ["string", "string", "string", "string"],
          "correctAnswer": "string",
          "explanation": "string"
        }
      ]
    }
  `;

  const cleanQuizText = (text) => text.replace(/```(?:json)?\n?/g, "").trim();

  const attemptGenerate = async (retries = 2, delayMs = 1000) => {
    try {
      const result = await model.generateContent(prompt);
      const response = result.response;
      const text = response.text();
      const cleanedText = cleanQuizText(text);
      const quiz = JSON.parse(cleanedText);
      return quiz.questions;
    } catch (err) {
      const status = err?.status || err?.response?.status;
      const msg = String(err || "");
      // Retry on transient errors (including 429) a few times
      if (retries > 0 && /429|Too Many Requests|rate-limit|quota/i.test(msg)) {
        await new Promise((r) => setTimeout(r, delayMs));
        return attemptGenerate(retries - 1, Math.min(5000, delayMs * 2));
      }
      throw err;
    }
  };

  const generateValidQuiz = async () => {
    for (let attempt = 1; attempt <= 3; attempt += 1) {
      const questions = await attemptGenerate();
      const normalizedQuestions = normalizeQuizQuestions(questions);
      if (normalizedQuestions && normalizedQuestions.length === 10) {
        return normalizedQuestions;
      }
      console.warn(
        `Quiz generation attempt ${attempt} returned invalid or duplicate questions.`
      );
      if (attempt < 3) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }
    throw new Error("Invalid model response");
  };

  try {
    const questions = await generateValidQuiz();
    return questions;
  } catch (error) {
    console.error("Error generating quiz:", error);
    const errMsg = String(error || "");
    if (/429|Too Many Requests|rate-limit|quota/i.test(errMsg)) {
      console.warn("Quota/rate-limit detected — returning local fallback quiz.");
      return generateLocalQuiz(user);
    }

    if (/Invalid model response/i.test(errMsg)) {
      console.warn("Invalid model response detected — returning local fallback quiz.");
      return generateLocalQuiz(user);
    }

    throw new Error("Failed to generate quiz questions");
  }
}

function normalizeQuizQuestions(questions) {
  if (!Array.isArray(questions)) return null;

  const uniqueQuestions = [];
  const seen = new Set();
  const questionStarts = new Set();

  for (const item of questions) {
    if (
      item &&
      typeof item.question === "string" &&
      Array.isArray(item.options) &&
      item.options.length === 4 &&
      item.options.every((o) => typeof o === "string") &&
      typeof item.correctAnswer === "string" &&
      typeof item.explanation === "string"
    ) {
      const trimmedQuestion = item.question.trim();
      const trimmedOptions = item.options.map((option) => option.trim());
      const trimmedCorrectAnswer = item.correctAnswer.trim();
      const trimmedExplanation = item.explanation.trim();

      if (
        !trimmedQuestion ||
        seen.has(trimmedQuestion) ||
        !trimmedOptions.every((option) => option) ||
        !trimmedCorrectAnswer ||
        !trimmedOptions.includes(trimmedCorrectAnswer) ||
        !trimmedExplanation
      ) {
        continue;
      }

      // Check for semantic similarity: questions starting with same phrase are likely duplicates
      const questionStart = trimmedQuestion.split("?")[0].substring(0, 30).toLowerCase();
      if (questionStarts.has(questionStart)) {
        continue;
      }

      seen.add(trimmedQuestion);
      questionStarts.add(questionStart);
      uniqueQuestions.push({
        question: trimmedQuestion,
        options: trimmedOptions,
        correctAnswer: trimmedCorrectAnswer,
        explanation: trimmedExplanation,
      });
    }
  }

  return uniqueQuestions.length ? uniqueQuestions : null;
}

function generateLocalQuiz(user) {
  const industryLabel = user?.industry || "your field";
  const questionsData = [
    {
      topic: "fundamental concepts",
      q: "What is the core principle behind",
      opts: ["solid design", "rapid prototyping", "iterative feedback", "agile methodology"],
    },
    {
      topic: "design patterns",
      q: "Which design pattern is best for",
      opts: ["singleton pattern", "factory pattern", "observer pattern", "decorator pattern"],
    },
    {
      topic: "performance optimization",
      q: "How would you improve performance in",
      opts: ["caching", "lazy loading", "compression", "pagination"],
    },
    {
      topic: "system architecture",
      q: "What architectural approach works best for",
      opts: ["microservices", "monolithic", "serverless", "distributed systems"],
    },
    {
      topic: "security best practices",
      q: "Which security measure is critical for",
      opts: ["encryption", "authentication", "rate limiting", "input validation"],
    },
    {
      topic: "testing strategies",
      q: "What testing approach ensures quality for",
      opts: ["unit testing", "integration testing", "end-to-end testing", "performance testing"],
    },
    {
      topic: "data handling",
      q: "How should you manage data in",
      opts: ["relational databases", "NoSQL databases", "caching layers", "data warehouses"],
    },
    {
      topic: "deployment",
      q: "What deployment strategy is recommended for",
      opts: ["blue-green", "canary", "rolling updates", "feature flags"],
    },
    {
      topic: "algorithms",
      q: "Which algorithm is most suitable for",
      opts: ["sorting", "searching", "hashing", "graph traversal"],
    },
    {
      topic: "troubleshooting",
      q: "What is the best approach to debugging",
      opts: ["logging", "breakpoints", "profiling", "monitoring"],
    },
  ];

  return questionsData.map((item, i) => {
    return {
      question: `${item.q} ${item.topic} in ${industryLabel}?`,
      options: item.opts,
      correctAnswer: item.opts[0],
      explanation: `Best practice for ${item.topic} in ${industryLabel}: ${item.opts[0]} is a key approach.`,
    };
  });
}

export async function saveQuizResult(questions, answers, score) {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  const questionResults = questions.map((q, index) => ({
    question: q.question,
    answer: q.correctAnswer,
    userAnswer: answers[index],
    isCorrect: q.correctAnswer === answers[index],
    explanation: q.explanation,
  }));

  // Get wrong answers
  const wrongAnswers = questionResults.filter((q) => !q.isCorrect);

  // Only generate improvement tips if there are wrong answers
  let improvementTip = null;
  if (wrongAnswers.length > 0) {
    const wrongQuestionsText = wrongAnswers
      .map(
        (q) =>
          `Question: "${q.question}"\nCorrect Answer: "${q.answer}"\nUser Answer: "${q.userAnswer}"`
      )
      .join("\n\n");

    const improvementPrompt = `
      The user got the following ${user.industry} technical interview questions wrong:

      ${wrongQuestionsText}

      Based on these mistakes, provide a concise, specific improvement tip.
      Focus on the knowledge gaps revealed by these wrong answers.
      Keep the response under 2 sentences and make it encouraging.
      Don't explicitly mention the mistakes, instead focus on what to learn/practice.
    `;

    try {
      const tipResult = await model.generateContent(improvementPrompt);

      improvementTip = tipResult.response.text().trim();
      console.log(improvementTip);
    } catch (error) {
      console.error("Error generating improvement tip:", error);
      // Continue without improvement tip if generation fails
    }
  }

  try {
    const assessment = await db.assessment.create({
      data: {
        userId: user.id,
        quizScore: score,
        questions: questionResults,
        category: "Technical",
        improvementTip,
      },
    });

    return assessment;
  } catch (error) {
    console.error("Error saving quiz result:", error);
    throw new Error("Failed to save quiz result");
  }
}

export async function getAssessments() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
  });

  if (!user) throw new Error("User not found");

  try {
    const assessments = await db.assessment.findMany({
      where: {
        userId: user.id,
      },
      orderBy: {
        createdAt: "asc",
      },
    });

    return assessments;
  } catch (error) {
    console.error("Error fetching assessments:", error);
    throw new Error("Failed to fetch assessments");
  }
}