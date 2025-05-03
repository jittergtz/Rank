import { Suspense } from "react"
import { createClient } from "@/utils/supabase/server"
import { redirect } from "next/navigation"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft } from "lucide-react"
import StatsClient from "@/components/app/Stats-Client"


export default async function StatsPage() {
  const supabase = await createClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return redirect("/sign-in")
  }

  return (
    <main className="container pb-40 mx-auto py-6 px-4">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" size="sm" asChild>
            <Link href="/app">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tracker
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">Your Stats</h1>
        </div>
      </div>

      <Suspense
        fallback={<div className="py-12 text-center">Loading stats...</div>}
      >
        <StatsClient />
      </Suspense>
    </main>
  )
}
