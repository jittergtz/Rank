"use client"
import { Bolt, ChartBar, House } from 'lucide-react'
import React from 'react'
import { usePathname } from 'next/navigation'

function Navigation() {
    const pathname = usePathname()

    return (
        <nav className='fixed bottom-0 w-full h-11'>
            <div className='flex justify-around text-neutral-500 items-center h-full'>
                <a href="/" className={pathname === '/app' ? 'text-neutral-100' : ''}>
                    <House size={16} />
                </a>
                <a href="/app/stats" className={pathname === '/app/stats' ? 'text-neutral-100' : ''}>
                    <ChartBar size={16} />
                </a>
                <a href="/app/profil" className={pathname === '/app/profil' ? 'text-neutral-100' : ''}>
                    <Bolt size={16} />
                </a>
            </div>
        </nav>
    )
}

export default Navigation