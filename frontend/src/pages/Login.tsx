import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { signInAsync, selectIsLoading, selectError, clearError } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Login page component.
 * 
 * Provides a form for users to sign in with email and password.
 * Features:
 * - Form validation
 * - Loading states
 * - Error handling
 * - Responsive design
 * - Accessibility (WCAG 2.1 AA)
 */
function Login() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')

  // Show message from location state (e.g., after signup or verification)
  useEffect(() => {
    const locationState = location.state as { message?: string } | null
    if (locationState?.message) {
      // You could show this as a toast notification or alert
      // For now, we'll just log it - you can enhance this with a toast library
      console.log(locationState.message)
    }
  }, [location.state])

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/')
    return null
  }

  /**
   * Validates email format.
   */
  const validateEmail = (value: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!value.trim()) {
      setEmailError('Email is required')
      return false
    }
    if (!emailRegex.test(value)) {
      setEmailError('Please enter a valid email address')
      return false
    }
    setEmailError('')
    return true
  }

  /**
   * Validates password.
   */
  const validatePassword = (value: string): boolean => {
    if (!value) {
      setPasswordError('Password is required')
      return false
    }
    if (value.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return false
    }
    setPasswordError('')
    return true
  }

  /**
   * Handles form submission.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Clear previous errors
    dispatch(clearError())
    setEmailError('')
    setPasswordError('')

    // Validate form fields
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)

    if (!isEmailValid || !isPasswordValid) {
      return
    }

    try {
      const result = await dispatch(
        signInAsync({
          email: email.trim(),
          password,
        })
      ).unwrap()

      // Navigate to profile page on successful login
      if (result) {
        navigate('/profile')
      }
    } catch (err) {
      // Error is handled by Redux state
      console.error('Login failed:', err)
      
      // Check if error is related to unverified email
      const errorMessage = err instanceof Error ? err.message : String(err)
      if (
        errorMessage.includes('UserNotConfirmedException') ||
        errorMessage.includes('not confirmed') ||
        errorMessage.includes('verification')
      ) {
        // Redirect to verification page with email pre-filled
        navigate('/verify-email', {
          state: {
            email: email.trim(),
            message: 'Please verify your email address before signing in.',
          },
        })
      }
    }
  }

  /**
   * Handles email input change.
   */
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setEmail(e.target.value)
    if (emailError) {
      validateEmail(e.target.value)
    }
  }

  /**
   * Handles password input change.
   */
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value)
    if (passwordError) {
      validatePassword(e.target.value)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Sign In
          </CardTitle>
          <CardDescription className="text-center">
            Enter your email and password to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {/* Email Input */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Email
              </label>
              <Input
                id="email"
                type="email"
                placeholder="name@example.com"
                value={email}
                onChange={handleEmailChange}
                onBlur={() => validateEmail(email)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                autoComplete="email"
                autoFocus
              />
              {emailError && (
                <p
                  id="email-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {emailError}
                </p>
              )}
            </div>

            {/* Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Password
              </label>
              <Input
                id="password"
                type="password"
                placeholder="Enter your password"
                value={password}
                onChange={handlePasswordChange}
                onBlur={() => validatePassword(password)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
                autoComplete="current-password"
              />
              {passwordError && (
                <p
                  id="password-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div
                className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                role="alert"
                aria-live="assertive"
              >
                {error}
              </div>
            )}
          </CardContent>
          <CardFooter className="flex flex-col space-y-4">
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
              aria-busy={isLoading}
            >
              {isLoading ? (
                <>
                  <span className="sr-only">Signing in...</span>
                  <span aria-hidden="true">Signing in...</span>
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Don't have an account?{' '}
              </span>
              <Link
                to="/signup"
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                Sign up
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default Login

