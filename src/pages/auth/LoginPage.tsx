import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth, UserRole } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import {
  RiShieldUserLine, RiUserSettingsLine, RiGraduationCapLine,
  RiSunLine, RiMoonLine, RiLockLine, RiMailLine, RiArrowLeftLine
} from 'react-icons/ri'

interface LoginCardProps {
  role: UserRole
  title: string
  icon: React.ReactNode
  color: string
  index: number
  onBack: () => void
}

function LoginCard({ role, title, icon, color, index, onBack }: LoginCardProps) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const { toast } = useToast()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) {
      toast({ title: 'Missing fields', description: 'Please enter email and password', variant: 'destructive' })
      return
    }
    setLoading(true)
    try {
      await login(email.trim().toLowerCase(), password, role)
      if (role === 'SUPER_ADMIN') navigate('/super-admin/dashboard')
      else if (role === 'ADMIN') navigate('/admin/dashboard')
      else navigate('/student/dashboard')
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || 'Login failed'
      toast({ title: 'Login failed', description: msg, variant: 'destructive' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
      className="w-full"
    >
      <div className="rounded-2xl border bg-card shadow-lg overflow-hidden">
        <div className={`${color} p-8 text-white relative`}>
          <Button 
            variant="ghost" 
            size="sm" 
            className="absolute top-4 left-4 text-white hover:bg-white/20 hover:text-white"
            onClick={onBack}
          >
            <RiArrowLeftLine className="mr-2" /> Back
          </Button>
          <div className="flex flex-col items-center gap-4 mt-4">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white/20 text-4xl shadow-inner">
              {icon}
            </div>
            <div className="text-center">
              <h2 className="text-2xl font-bold">{title} Login</h2>
              <p className="text-sm opacity-80 uppercase tracking-wider">{role.replace('_', ' ')}</p>
            </div>
          </div>
        </div>
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="space-y-2">
            <Label htmlFor={`${role}-email`} className="text-sm font-medium">Email Address</Label>
            <div className="relative">
              <RiMailLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg" />
              <Input
                id={`${role}-email`}
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={`${role}-password`} className="text-sm font-medium">Password</Label>
            <div className="relative">
              <RiLockLine className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-lg" />
              <Input
                id={`${role}-password`}
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="pl-10 h-11"
              />
            </div>
          </div>
          <div className="flex justify-end">
            <Link to="/forgot-password" className="text-xs text-primary hover:text-primary/80 font-semibold">
              Forgot password?
            </Link>
          </div>
          <Button type="submit" className="w-full h-11 font-bold" disabled={loading}>
            {loading ? 'Signing in...' : `Sign in as ${title}`}
          </Button>
        </form>
      </div>
    </motion.div>
  )
}

export default function LoginPage() {
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null)
  const { theme, toggleTheme } = useTheme()

  const roles = [
    {
      role: 'SUPER_ADMIN' as UserRole,
      title: 'Super Admin',
      icon: <RiShieldUserLine />,
      color: 'bg-gradient-to-r from-purple-600 to-purple-700',
    },
    {
      role: 'ADMIN' as UserRole,
      title: 'Admin',
      icon: <RiUserSettingsLine />,
      color: 'bg-gradient-to-r from-blue-600 to-blue-700',
    },
    {
      role: 'STUDENT' as UserRole,
      title: 'Student',
      icon: <RiGraduationCapLine />,
      color: 'bg-gradient-to-r from-emerald-600 to-emerald-700',
    },
  ]

  const activeRoleData = roles.find(r => r.role === selectedRole)

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 dark:from-slate-950 dark:to-slate-900 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6">
        <div className="flex items-center gap-3">
          <img src="/logo.ico" alt="PixelWind Logo" className="h-16 w-16 rounded-lg object-contain" />
          <div>
            <span className="text-xl font-bold text-foreground">PixelWind</span>
            <p className="text-xs text-muted-foreground">Training & Certificate Management</p>
          </div>
        </div>
        <Button variant="ghost" size="icon" onClick={toggleTheme}>
          {theme === 'dark' ? <RiSunLine className="h-5 w-5" /> : <RiMoonLine className="h-5 w-5" />}
        </Button>
      </div>

      {/* Main */}
      <div className="flex flex-1 flex-col items-center justify-center px-6 pb-12">
        {!selectedRole ? (
          <>
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-12 text-center"
            >
              <h1 className="text-4xl font-extrabold text-foreground mb-3 tracking-tight">Welcome to PixelWind</h1>
              <p className="text-lg text-muted-foreground">Choose your portal to sign in</p>
            </motion.div>

            <div className="flex flex-col lg:flex-row gap-8 w-full max-w-5xl justify-center">
              {roles.map((r, i) => (
                <motion.div
                  key={r.role}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.5 }}
                  onClick={() => setSelectedRole(r.role)}
                  className="flex-1 min-w-[280px] max-sm:w-full max-w-sm group cursor-pointer"
                >
                  <div className="h-full rounded-3xl border bg-card shadow-md hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col items-center p-10 text-center border-transparent hover:border-primary/20">
                    <div className={`h-24 w-24 rounded-3xl ${r.color} text-white flex items-center justify-center text-5xl mb-8 group-hover:scale-110 transition-transform shadow-lg`}>
                      {r.icon}
                    </div>
                    <h2 className="text-2xl font-bold text-foreground mb-3">{r.title}</h2>
                    <p className="text-sm text-muted-foreground mb-8 leading-relaxed">Login to access your personalized {r.role === 'SUPER_ADMIN' ? 'management' : r.title.toLowerCase()} workspace</p>
                    <Button variant="outline" className="w-full h-11 font-semibold group-hover:bg-primary group-hover:text-primary-foreground transition-colors rounded-xl">
                      Get Started
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </>
        ) : (
          <div className="w-full max-w-md">
            <LoginCard
              {...activeRoleData!}
              index={0}
              onBack={() => setSelectedRole(null)}
            />
          </div>
        )}
      </div>
    </div>
  )
}
