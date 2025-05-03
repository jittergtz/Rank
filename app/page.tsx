import { EnvVarWarning } from "@/components/env-var-warning";
import HeaderAuth from "@/components/header-auth";
import Hero from "@/components/hero";
import ConnectSupabaseSteps from "@/components/tutorial/connect-supabase-steps";
import SignUpUserSteps from "@/components/tutorial/sign-up-user-steps";
import { hasEnvVars } from "@/utils/supabase/check-env-vars";
import Image from "next/image";
import Link from "next/link";

export default async function Home() {
  return (
    <>
   
      <main className="flex flex-col h-[70vh] items-center justify-center gap-6 px-4">
        <nav className="absolute top-3 p-2 rounded-full border  w-full px-5">
          <div className="flex w-full items-center justify-between">
            <h1>Rank</h1>
            {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
            </div>
       
        </nav>
        <h2 className=" text-8xl mb-4 text-transparent bg-clip-text bg-gradient-to-t from-[#f8f8fa] to-[#bcbcc0] ">Rank</h2>
        <Image
        src={"/images/UltraRank.jpg"}
        alt="Rank"
        width={1120}
        height={1120}
        className="w-40 rounded-xl shadow-xl shadow-black"/>


        <Link href={"/sign-up"} className="bg-neutral-50 mt-10 shadow-sm shadow-white hover:scale-105 duration-200 p-3 w-64 text-center rounded-full text-black">Start now</Link>
               
      </main>
    </>
  );
}
