"use server"
import { db } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { DemandLevel, MarketOutlook } from "@prisma/client";

export async function updateUser(data) {
const {userId}=await auth();
if(!userId) throw new Error("User not authenticated")

    const user= await db.user.findUnique({   
        where:{
            id:userId
        }
    });
    if(!user) throw new Error("User not found")  
        
        
try {
    const result=await db.$transaction(async (tx) => {
         //if the industry exists
    let industryInsight = await tx.industryIinsight.findUnique({
        where: {
            industry: data.industry,
        },
    })

    //if industry does not exist,create it with default values-will replace with ai later

    if(!industryInsight) {
        industryInsight = await tx.industryIinsight.create({
            data: {
                industry: data.industry,
                salaryRanges:[],
                growthRate:0,
                DemandLevel:"Medium",
                topSkills:[],
                MarketOutlook:"neutral",
                keyTrends:[],
                recommendations:[],
                nextUpdate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), //  1 week  from now
              
            },
        })
    }
    //update the user
    const updatedUser = await tx.user.update({
        where: {
          id: user.id,
        },
        data: {
          industry: data.industry,
          experience: data.experience,
          bio: data.bio,
          skills: data.skills,
        },
      });

      return { updatedUser, industryInsight };
    },
    {
            timeout:10000,//default 5 seconds
        });
   return result.user;
    
} catch (error) {
    console.error("Error updating user:", error.message);
    throw new Error("Error updating user");
}

    }
 export async function getUserOnboardingStatus() {
        const { userId } = await auth();
        if (!userId) throw new Error("Unauthorized");
      
        const user = await db.user.findUnique({
          where: { clerkUserId: userId },
        });
      
        if (!user) throw new Error("User not found");
      
        try {
          const user = await db.user.findUnique({
            where: {
              clerkUserId: userId,
            },
            select: {
              industry: true,
            },
          });
      
          return {
            isOnboarded: !!user?.industry,
          };
        } catch (error) {
          console.error("Error checking onboarding status:", error);
          throw new Error("Failed to check onboarding status");
        }
    }