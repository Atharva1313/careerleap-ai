"use server";

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

const isQuotaOrRateLimitError = (error) => {
  const message = String(error?.message || error || "");
  const status = error?.status || error?.response?.status;
  return status === 429 || /429|Too Many Requests|rate-limit|quota/i.test(message);
};

const parseAiJson = (text) => {
  const cleanedText = text.replace(/```(?:json)?\n?/g, "").trim();
  return JSON.parse(cleanedText);
};

const getIndustryInsightsFallback = (industry) => {
  const normalized = industry || "your industry";
  return {
    salaryRanges: [
      { role: "Junior Developer", min: 45000, max: 65000, median: 55000, location: "Remote" },
      { role: "Mid-Level Specialist", min: 65000, max: 90000, median: 78000, location: "Remote" },
      { role: "Senior Professional", min: 90000, max: 125000, median: 105000, location: "Remote" },
      { role: "Team Lead", min: 110000, max: 145000, median: 127500, location: "Remote" },
      { role: "Manager", min: 130000, max: 170000, median: 150000, location: "Remote" },
    ],
    growthRate: 6.5,
    demandLevel: "High",
    topSkills: [
      "communication",
      "problem solving",
      "adaptability",
      "critical thinking",
      "collaboration",
    ],
    marketOutlook: "Positive",
    keyTrends: [
      `Remote and hybrid work continuing to expand in ${normalized}`,
      "Increased automation and AI assistance in daily workflows",
      "Greater demand for flexible, cross-functional skill sets",
      "Focus on upskilling and continuous professional development",
      "Stronger emphasis on collaboration and digital tools",
    ],
    recommendedSkills: [
      "project management",
      "communication",
      "data literacy",
      "team collaboration",
      "industry-specific fundamentals",
    ],
  };
};

export const generateAIInsights = async (industry) => {
  const prompt = `
          Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
          {
            "salaryRanges": [
              { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
            ],
            "growthRate": number,
            "demandLevel": "High" | "Medium" | "Low",
            "topSkills": ["skill1", "skill2"],
            "marketOutlook": "Positive" | "Neutral" | "Negative",
            "keyTrends": ["trend1", "trend2"],
            "recommendedSkills": ["skill1", "skill2"]
          }

          IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
          Include at least 5 common roles for salary ranges.
          Growth rate should be a percentage.
          Include at least 5 skills and trends.
        `;

  try {
    const result = await model.generateContent(prompt);
    const response = result.response;
    const text = response.text();
    return parseAiJson(text);
  } catch (error) {
    console.error("AI insights generation failed:", error);
    if (isQuotaOrRateLimitError(error)) {
      console.warn("Quota/rate-limit detected for AI insights, using fallback data.");
      return getIndustryInsightsFallback(industry);
    }
    // Fall back on any parsing or unexpected runtime error as well.
    return getIndustryInsightsFallback(industry);
  }
};

export async function getIndustryInsights() {
  const { userId } = await auth();
  if (!userId) throw new Error("Unauthorized");

  const user = await db.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      industryInsight: true,
    },
  });

  if (!user) throw new Error("User not found");

  // If no insights exist, generate them
  if (!user.industryInsight) {
    const insights = await generateAIInsights(user.industry);

    const industryInsight = await db.industryInsight.create({
      data: {
        industry: user.industry,
        ...insights,
        nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return industryInsight;
  }

  return user.industryInsight;
}