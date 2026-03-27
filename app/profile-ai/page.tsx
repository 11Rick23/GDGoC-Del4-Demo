import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { ProfileAiPageClient } from "@/app/profile-ai/profile-ai-page-client"

export default async function ProfileAiPage() {
  const session = await auth()

  if (!session?.user?.id) {
    redirect("/")
  }

  return <ProfileAiPageClient />
}
