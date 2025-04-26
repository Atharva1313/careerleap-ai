import { getUserOnboardingStatus } from "@/actions/user";
import { redirect } from "next/navigation";


const IndustryInsightPage = async() => {

   const {isOnborded}= await getUserOnboardingStatus();
   if(!isOnborded) {
      redirect("/onbording") ;
    }
  return (
    <div>
      
    </div>
  )
}

export default IndustryInsightPage
