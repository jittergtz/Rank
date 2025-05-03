import { Geist } from "next/font/google";
import Navigation from "@/components/app/Navigation";



const geistSans = Geist({
  display: "swap",
  subsets: ["latin"],
});

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
   <main>


        
       
            
                {children}
         
            <Navigation/>
         
       
   </main>
    
  );
}
