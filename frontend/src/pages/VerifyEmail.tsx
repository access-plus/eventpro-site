import { useState, type FormEvent } from 'react'
import { useNavigate, useLocation, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { verifyEmailAsync, resendVerificationCodeAsync, selectIsLoading, selectError, clearError } from '@/store/slices/authSlice'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Verify Email page component.
 * 
 * Allows users to verify their email address by entering the verification code
 * sent to their email after signup.
 * Features:
 * - Code input with validation
 * - Resend verification code functionality
 * - Loading states
 * - Error handling
 * - Responsive design
 * - Accessibility (WCAG 2.1 AA)
 */
function VerifyEmail() {
  const navigate = useNavigate()
  const location = useLocation()
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  // Get email from location state (passed from signup or login)
  const emailFromState = (location.state as { email?: string })?.email
  const [email, setEmail] = useState(emailFromState || '')
  const [verificationCode, setVerificationCode] = useState('')
  const [codeError, setCodeError] = useState('')
  const [emailError, setEmailError] = useState('')
  const [resendSuccess, setResendSuccess] = useState(false)

  // Redirect if already authenticated
  if (isAuthenticated) {
    navigate('/', { replace: true })
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
   * Validates verification code.
   */
  const validateCode = (value: string): boolean => {
    if (!value.trim()) {
      setCodeError('Verification code is required')
      return false
    }
    if (value.trim().length !== 6) {
      setCodeError('Verification code must be 6 digits')
      return false
    }
    if (!/^\d+$/.test(value.trim())) {
      setCodeError('Verification code must contain only numbers')
      return false
    }
    setCodeError('')
    return true
  }

  /**
   * Handles form submission for email verification.
   */
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Clear previous errors
    dispatch(clearError())
    setCodeError('')
    setEmailError('')
    setResendSuccess(false)

    // Validate form fields
    const isEmailValid = validateEmail(email)
    const isCodeValid = validateCode(verificationCode)

    if (!isEmailValid || !isCodeValid) {
      return
    }

    try {
      await dispatch(
        verifyEmailAsync({
          email: email.trim(),
          code: verificationCode.trim(),
        })
      ).unwrap()

      // Verification successful, redirect to login
      navigate('/login', {
        state: {
          message: 'Email verified successfully! You can now sign in.',
        },
      })
    } catch (err) {
      // Error is handled by Redux state
      console.error('Email verification failed:', err)
    }
  }

  /**
   * Handles resend verification code.
   */
  const handleResendCode = async () => {
    // Clear previous errors and success messages
    dispatch(clearError())
    setCodeError('')
    setEmailError('')
    setResendSuccess(false)

    // Validate email
    if (!validateEmail(email)) {
      return
    }

    try {
      await dispatch(
        resendVerificationCodeAsync({
          email: email.trim(),
        })
      ).unwrap()

      // Show success message
      setResendSuccess(true)
      // Clear success message after 5 seconds
      setTimeout(() => setResendSuccess(false), 5000)
    } catch (err) {
      // Error is handled by Redux state
      console.error('Resend verification code failed:', err)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Verify Your Email
          </CardTitle>
          <CardDescription className="text-center">
            Enter the verification code sent to your email address
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
                onChange={(e) => {
                  setEmail(e.target.value)
                  if (emailError) {
                    validateEmail(e.target.value)
                  }
                }}
                onBlur={() => validateEmail(email)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!emailError}
                aria-describedby={emailError ? 'email-error' : undefined}
                autoComplete="email"
                autoFocus={!emailFromState}
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

            {/* Verification Code Input */}
            <div className="space-y-2">
              <label
                htmlFor="verificationCode"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Verification Code
              </label>
              <Input
                id="verificationCode"
                type="text"
                placeholder="123456"
                value={verificationCode}
                onChange={(e) => {
                  // Only allow numbers and limit to 6 digits
                  const value = e.target.value.replace(/\D/g, '').slice(0, 6)
                  setVerificationCode(value)
                  if (codeError) {
                    validateCode(value)
                  }
                }}
                onBlur={() => validateCode(verificationCode)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!codeError}
                aria-describedby={codeError ? 'code-error' : undefined}
                autoComplete="one-time-code"
                autoFocus={!!emailFromState}
                maxLength={6}
              />
              {codeError && (
                <p
                  id="code-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {codeError}
                </p>
              )}
              <p className="text-xs text-muted-foreground">
                Enter the 6-digit code sent to your email
              </p>
            </div>

            {/* Success Message for Resend */}
            {resendSuccess && (
              <div
                className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400"
                role="alert"
                aria-live="assertive"
              >
                Verification code resent successfully! Please check your email.
              </div>
            )}

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
                  <span className="sr-only">Verifying...</span>
                  <span aria-hidden="true">Verifying...</span>
                </>
              ) : (
                'Verify Email'
              )}
            </Button>
            <div className="flex flex-col items-center space-y-2">
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={handleResendCode}
                disabled={isLoading || !email.trim()}
              >
                Resend Verification Code
              </Button>
              <div className="text-center text-sm">
                <span className="text-muted-foreground">
                  Already verified?{' '}
                </span>
                <Link
                  to="/login"
                  className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
                >
                  Sign in
                </Link>
              </div>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default VerifyEmail

