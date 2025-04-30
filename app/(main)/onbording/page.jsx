import { getUserOnboardingStatus } from "@/actions/user";
import { industries } from "@/data/industries";


import { redirect } from "next/navigation";
import OnboardingForm from "./_components/onbording-form";

const Onboarding= async ()=> {
  
  const { isOnboarded } = await getUserOnboardingStatus();

  // if (isOnboarded) {
  //   redirect("/dashbord");
  // }

  return (
    <main>
      <OnboardingForm  industries={industries} />
    </main>
  );
}
export default Onboarding;