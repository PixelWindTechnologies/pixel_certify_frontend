import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { UserRole } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useToast } from '@/hooks/use-toast'
import { RiMailLine, RiArrowLeftLine, RiCheckLine } from 'react-icons/ri'
import api from '@/lib/api'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<UserRole>('STUDENT')
  const [loading, setLoading] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) {
      toast({ title: 'Error', description: 'Please enter your email', variant: 'destructive' })
      return
    }

    setLoading(true)
    try {
      // Trim email to prevent common whitespace errors
      await api.post('/auth/forgot-password', { email: email.trim(), role })
      setSubmitted(true)
      toast({
        title: 'Success',
        description: 'If an account exists with this email, you will receive a password reset link.',
      })
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.response?.data?.message || 'Failed to send reset email',
        variant: 'destructive',
      })
    } finally {
      setLoading(false)
    }
  }

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
  }

  return (
    <div className={`min-h-screen flex items-center justify-center ${theme === 'dark' ? 'bg-slate-900' : 'bg-gray-50'}`}>
      <motion.div
        className="w-full max-w-md"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <div className={`${theme === 'dark' ? 'bg-slate-800' : 'bg-white'} rounded-lg shadow-lg p-8`}>
          {submitted ? (
            <div className="text-center space-y-4">
              <motion.div
                className="flex justify-center"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: 'spring', stiffness: 200 }}
              >
                <div className="bg-green-100 dark:bg-green-900 p-4 rounded-full">
                  <RiCheckLine className="text-green-600 dark:text-green-400 text-4xl" />
                </div>
              </motion.div>
              <h2 className="text-2xl font-bold">Check Your Email</h2>
              <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                We've sent a password reset link to
              </p>
              <p className="font-semibold text-primary">{email}</p>
              <p className={`text-sm ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                The link will expire in 1 hour. If you don't see the email, check your spam folder.
              </p>
              <Button
                onClick={() => navigate('/login')}
                className="w-full mt-6"
              >
                Back to Login
              </Button>
            </div>
          ) : (
            <>
              <div className="mb-8">
                <Link
                  to="/login"
                  className="flex items-center gap-2 text-primary hover:text-primary/80 transition-colors mb-4"
                >
                  <RiArrowLeftLine /> Back to Login
                </Link>
                <h1 className="text-3xl font-bold mb-2">Forgot Password?</h1>
                <p className={`${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                  No worries! Enter your email and we'll send you a reset link.
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <Label className="mb-2 block">Select Your Role</Label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as UserRole)}
                    className={`w-full px-4 py-2 rounded-lg border transition-colors ${
                      theme === 'dark'
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-white border-gray-300'
                    } focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/10`}
                  >
                    <option value="STUDENT">Student</option>
                    <option value="ADMIN">Admin</option>
                    <option value="SUPER_ADMIN">Super Admin</option>
                  </select>
                </div>

                <div>
                  <Label htmlFor="email" className="mb-2 block">
                    Email Address
                  </Label>
                  <div className="relative">
                    <RiMailLine className="absolute left-3 top-3 text-gray-400 text-xl" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="Enter your email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="pl-10"
                      disabled={loading}
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? 'Sending...' : 'Send Reset Link'}
                </Button>
              </form>

              <p className={`text-center text-sm mt-6 ${theme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                Remember your password?{' '}
                <Link
                  to="/login"
                  className="text-primary hover:text-primary/80 font-semibold transition-colors"
                >
                  Back to Login
                </Link>
              </p>
            </>
          )}
        </div>
      </motion.div>
    </div>
  )
}
