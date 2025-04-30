"use server"

import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model=genAI.getGenerativeModel({
    model:"gemini-1.5-flash"
});
export const generateAIInsights = async (industry) => {
const promt=`
    Analyze the current state of the ${industry} industry and provide insights in ONLY the following JSON format without any additional notes or explanations:
{
  "salaryRanges": [
    { "role": "string", "min": number, "max": number, "median": number, "location": "string" }
  ],
  "growthRate": number,
  "demandLevel": "High" | "Medium" | "Low",
  "topSkills": ["skill1", "skill2"],
  "marketOutlook": "POSITIVE" | "NEUTRAL" | "NEGATIVE", 
  "keyTrends": ["trend1", "trend2"],
  "recommendedSkills": ["skill1", "skill2"]
}

IMPORTANT: Return ONLY the JSON. No additional text, notes, or markdown formatting.
Include at least 5 common roles for salary ranges.
Growth rate should be a percentage.
Include at least 5 skills and trends.
`
const result=await model.generateContent(promt)
const response=result.response;
const text =response.text()

const cleanedTest = text.replace(/```(?:json)?\n?/g, "").trim();
return JSON.parse(cleanedTest);

};

export async function getIndustryInsights() {
    const { userId } = await auth();
            if (!userId) throw new Error("Unauthorized");
          
            const user = await db.user.findUnique({
              where: { clerkUserId: userId },
            });
          
            if (!user) throw new Error("User not found");

            if(!user.industryInsight) {
               const insight=await generateAIInsights(user.industry);
               const createdInsight=await db.industryInsight.create({
                data:{
                    industry:user.industry,
                    ...insight,
                    nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                }
                });
                return IndustaryInsight;
                
            }
            return user.industryInsight;
}