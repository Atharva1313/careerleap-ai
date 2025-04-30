

import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";



const IndustaryInsightPage= async() => {
  const { isOnboarded } = await getUserOnboardingStatus();
  if (!isOnboarded) {
    redirect("/onboarding");
  }
  return (
    <div>
      IdustaryInsight
    </div>
  )
}

export default IndustaryInsightPage

