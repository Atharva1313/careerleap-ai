"use client"
import { useState } from "react"
import{ zodResolver } from "@hookform/resolvers/zod"
import { onboardingSchema } from "@/app/lib/schema"
import { useForm } from "react-hook-form"
import {  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { useRouter } from "next/navigation"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"

const onbordingForm = ({industries}) => {
const [selectedIndustary, setselectedIndustary] = useState(null);

 const router=useRouter();
 const {
  register,
  handleSubmit,
  formState:{errors},
  setValue,
  watch,
}= useForm({resolver: zodResolver
    (onboardingSchema)})
  return (
    <div className="flex  items-center justify-center bg-background">
      <Card className="w-full max-w-lg mt-10 mx-2">
  <CardHeader>
    <CardTitle className="gradient-tittle text-4xl">Card Title</CardTitle>
    <CardDescription>Card Description</CardDescription>
  </CardHeader>
  <CardContent>
    <div className="space-y-2">

    <Label htmlFor='industtry'>Industary</Label>
    <form>
    <Select className="">
  <SelectTrigger id="industry">
    <SelectValue placeholder="Select an industary " />
  </SelectTrigger>
  <SelectContent>
    {industries.map((ind) => {


     return <SelectItem value={ind.id} key={ind.id} >{ind.name} </SelectItem>
})};
   
  </SelectContent>
</Select>

    </form>
    </div>
  </CardContent>
  
</Card>

    </div>
  )
}

export default  onbordingForm
