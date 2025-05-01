import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Link from "next/link";

export default async function Home() {
  return (
    <>
   
      <main className="flex flex-col h-[70vh] items-center justify-center gap-6 px-4">
        <h2 className="font-medium text-8xl mb-4">Rank</h2>
                {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
      </main>
    </>
  );
}
