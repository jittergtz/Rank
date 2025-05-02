"use client"
import { Bolt, ChartBar, House } from 'lucide-react'
import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

function Navigation() {
    const pathname = usePathname()

    return (
        <nav className='fixed bottom-5 w-full '>
            <div className='flex justify-center backdrop-blur-2xl rounded-xl  text-neutral-500 items-center h-full'>
                <Link href="/" className={`  p-4 w-40  flex justify-center  ${pathname === '/app' ? 'text-neutral-100' : ''}`}>
                    <House size={20} />
                </Link>
                <Link href="/app/stats" className={` p-4 w-40  flex justify-center  ${pathname === '/app/stats' ? 'text-neutral-100' : ''}`}>
                    <ChartBar size={20} />
                </Link>
                <Link href="/app/profil" className={`p-4 w-40  flex justify-center ${pathname === '/app/profil' ? 'text-neutral-100' : ''}`}>
                    <Bolt size={20} />
                </Link>
            </div>
        </nav>
    )
}

export default Navigation