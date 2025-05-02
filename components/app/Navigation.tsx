"use client"
import { Bolt, ChartBar, House } from 'lucide-react'
import React from 'react'
import { usePathname } from 'next/navigation'
import Link from 'next/link'

function Navigation() {
    const pathname = usePathname()

    return (
        <nav className='fixed bottom-0 w-full h-20'>
            <div className='flex justify-around text-neutral-500 items-center h-full'>
                <Link href="/" className={pathname === '/app' ? 'text-neutral-100' : ''}>
                    <House size={20} />
                </Link>
                <Link href="/app/stats" className={pathname === '/app/stats' ? 'text-neutral-100' : ''}>
                    <ChartBar size={20} />
                </Link>
                <Link href="/app/profil" className={pathname === '/app/profil' ? 'text-neutral-100' : ''}>
                    <Bolt size={20} />
                </Link>
            </div>
        </nav>
    )
}

export default Navigation