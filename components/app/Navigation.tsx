"use client"
import { Bolt, ChartBar, Eye, House } from 'lucide-react'
import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

function Navigation() {
    const pathname = usePathname()

    return (
        <nav className='fixed bottom-8 w-full '>
            <div className='flex justify-center backdrop-blur-2xl rounded-xl  text-neutral-500 items-center h-full'>
                <Link href="/" className={`  p-4 w-40  flex justify-center  ${pathname === '/app' ? 'text-neutral-100' : ''}`}>
                    <div className='flex flex-col items-center'>
                    <House size={20} />
                    <p className='text-xs'>Home</p>
                    </div>
                </Link>
                <Link href="/app/focus" className={`  p-4 w-40  flex justify-center  ${pathname === '/app/focus' ? 'text-neutral-100' : ''}`}>
                <div className='flex flex-col items-center'>
                    <Eye size={20} />
                    <p className='text-xs'>Focus</p>
                    </div>
                </Link>
                <Link href="/app/stats" className={` p-4 w-40  flex justify-center  ${pathname === '/app/stats' ? 'text-neutral-100' : ''}`}>
                <div className='flex flex-col items-center'>
                    <ChartBar size={20} />
                    <p className='text-xs'>Stats</p>
                    </div>
                </Link>
                <Link href="/app/profil" className={`p-4 w-40  flex justify-center ${pathname === '/app/profil' ? 'text-neutral-100' : ''}`}>
                <div className='flex flex-col items-center'>
                    <Bolt size={20} />
                    <p className='text-xs'>Profil</p>
                    </div>
                </Link>
            </div>
        </nav>
    )
}

export default Navigation