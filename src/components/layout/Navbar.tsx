import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { RiSunLine, RiMoonLine, RiLogoutBoxLine } from 'react-icons/ri'
import { useNavigate } from 'react-router-dom'

export default function Navbar({ title }: { title?: string }) {
  const { user, logout } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/')
  }

  return (
    <header className="flex h-16 items-center justify-between border-b bg-background px-6">
      <div>
        <h1 className="text-lg font-semibold text-foreground">{title || 'Dashboard'}</h1>
      </div>
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={toggleTheme} title="Toggle theme">
          {theme === 'dark' ? <RiSunLine className="h-5 w-5" /> : <RiMoonLine className="h-5 w-5" />}
        </Button>
        <div className="flex items-center gap-2 text-sm">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white font-semibold text-xs">
            {(user?.fullName || user?.username || 'U')[0].toUpperCase()}
          </div>
          <span className="font-medium hidden sm:block">{user?.fullName || user?.username}</span>
        </div>
        <Button variant="ghost" size="icon" onClick={handleLogout} title="Logout">
          <RiLogoutBoxLine className="h-5 w-5 text-destructive" />
        </Button>
      </div>
    </header>
  )
}
