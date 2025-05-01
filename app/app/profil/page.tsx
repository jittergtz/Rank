import { EnvVarWarning } from '@/components/env-var-warning'
import HeaderAuth from '@/components/header-auth'
import { ThemeSwitcher } from '@/components/theme-switcher'
import { hasEnvVars } from '@/utils/supabase/check-env-vars'
import React from 'react'

function Profil() {
  return (
    <div className='h-screen w-full'>
     
<div className='flex w-full p-5 justify-between'>
                         <ThemeSwitcher/>
                        
                        {!hasEnvVars ? <EnvVarWarning /> : <HeaderAuth />}
                </div>                  
    </div>
  )
}

export default Profil