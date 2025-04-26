import { getUserOnboardingStatus } from "@/actions/user"
import { industries } from "@/data/industries"
import { redirect } from "next/navigation";
import OnbordingForm from "./_components/onbording-form";


const onbording = async() => {

 const {isOnborded}= await getUserOnboardingStatus();
 if(isOnborded) {
    redirect("/dashboard") ;
  }
  return (
    <main>
        <OnbordingForm industries={industries}/>
        
    </main>
  )
}

export default onbording
