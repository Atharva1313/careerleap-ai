

import { getIndustryInsights } from "@/actions/dashboard";
import { getUserOnboardingStatus } from "@/actions/user";
import { LayoutDashboard } from "lucide-react";
import { redirect } from "next/navigation";



const IndustaryInsightPage= async() => {
  const { isOnboarded } = await getUserOnboardingStatus();
  const insights=await getIndustryInsights();

  if (!isOnboarded) {
    redirect("/onboarding");
  }
  return (
    <div className="container mx-auto">
      <DashboardView insights={insights} />
    </div>
  )
}

export default IndustaryInsightPage

