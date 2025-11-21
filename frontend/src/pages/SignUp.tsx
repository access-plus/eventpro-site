import { useState, useEffect, type FormEvent } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { useAppDispatch, useAppSelector } from '@/store/hooks'
import { signUpAsync, signInAsync, selectIsLoading, selectError, clearError } from '@/store/slices/authSlice'
import { syncUserFromCognito } from '@/services/userService'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'

/**
 * Password strength levels.
 */
type PasswordStrength = 'weak' | 'fair' | 'good' | 'strong'

/**
 * Calculates password strength based on complexity.
 */
const calculatePasswordStrength = (password: string): PasswordStrength => {
  if (password.length === 0) return 'weak'
  
  let strength = 0
  
  // Length check
  if (password.length >= 8) strength++
  if (password.length >= 12) strength++
  
  // Character variety checks
  if (/[a-z]/.test(password)) strength++
  if (/[A-Z]/.test(password)) strength++
  if (/[0-9]/.test(password)) strength++
  if (/[^a-zA-Z0-9]/.test(password)) strength++
  
  if (strength <= 2) return 'weak'
  if (strength <= 4) return 'fair'
  if (strength <= 5) return 'good'
  return 'strong'
}

/**
 * Gets password strength color.
 */
const getPasswordStrengthColor = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'bg-destructive'
    case 'fair':
      return 'bg-orange-500'
    case 'good':
      return 'bg-yellow-500'
    case 'strong':
      return 'bg-green-500'
    default:
      return 'bg-muted'
  }
}

/**
 * Gets password strength text.
 */
const getPasswordStrengthText = (strength: PasswordStrength): string => {
  switch (strength) {
    case 'weak':
      return 'Weak'
    case 'fair':
      return 'Fair'
    case 'good':
      return 'Good'
    case 'strong':
      return 'Strong'
    default:
      return ''
  }
}

/**
 * Sign up page component.
 * 
 * Provides a form for users to create a new account.
 * Features:
 * - Form validation (email format, password strength, matching passwords)
 * - Password strength indicator
 * - Loading states
 * - Error handling
 * - Responsive design
 * - Accessibility (WCAG 2.1 AA)
 */
function SignUp() {
  const navigate = useNavigate()
  const dispatch = useAppDispatch()
  const isLoading = useAppSelector(selectIsLoading)
  const error = useAppSelector(selectError)
  const isAuthenticated = useAppSelector((state) => state.auth.isAuthenticated)

  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')
  
  const [emailError, setEmailError] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [confirmPasswordError, setConfirmPasswordError] = useState('')
  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [phoneNumberError, setPhoneNumberError] = useState('')

  const passwordStrength = calculatePasswordStrength(password)

  // Redirect if already authenticated - use useEffect to avoid redirect during render
  useEffect(() => {
    if (isAuthenticated) {
      navigate('/', { replace: true })
    }
  }, [isAuthenticated, navigate])

  // Don't render the form if already authenticated (while redirect is happening)
  if (isAuthenticated) {
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
   * Validates password strength.
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
    if (!/[a-z]/.test(value)) {
      setPasswordError('Password must contain at least one lowercase letter')
      return false
    }
    if (!/[A-Z]/.test(value)) {
      setPasswordError('Password must contain at least one uppercase letter')
      return false
    }
    if (!/[0-9]/.test(value)) {
      setPasswordError('Password must contain at least one number')
      return false
    }
    if (!/[^a-zA-Z0-9]/.test(value)) {
      setPasswordError('Password must contain at least one special character')
      return false
    }
    setPasswordError('')
    return true
  }

  /**
   * Validates password confirmation.
   */
  const validateConfirmPassword = (value: string, passwordValue: string): boolean => {
    if (!value) {
      setConfirmPasswordError('Please confirm your password')
      return false
    }
    if (value !== passwordValue) {
      setConfirmPasswordError('Passwords do not match')
      return false
    }
    setConfirmPasswordError('')
    return true
  }

  /**
   * Validates first name.
   */
  const validateFirstName = (value: string): boolean => {
    if (!value.trim()) {
      setFirstNameError('First name is required')
      return false
    }
    if (value.trim().length < 2) {
      setFirstNameError('First name must be at least 2 characters')
      return false
    }
    setFirstNameError('')
    return true
  }

  /**
   * Validates last name.
   */
  const validateLastName = (value: string): boolean => {
    if (!value.trim()) {
      setLastNameError('Last name is required')
      return false
    }
    if (value.trim().length < 2) {
      setLastNameError('Last name must be at least 2 characters')
      return false
    }
    setLastNameError('')
    return true
  }

  /**
   * Validates phone number (optional).
   */
  const validatePhoneNumber = (value: string): boolean => {
    if (!value.trim()) {
      setPhoneNumberError('')
      return true // Phone number is optional
    }
    // Basic phone number validation (allows various formats)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/
    if (!phoneRegex.test(value) || value.replace(/\D/g, '').length < 10) {
      setPhoneNumberError('Please enter a valid phone number')
      return false
    }
    setPhoneNumberError('')
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
    setConfirmPasswordError('')
    setFirstNameError('')
    setLastNameError('')
    setPhoneNumberError('')

    // Validate all form fields
    const isEmailValid = validateEmail(email)
    const isPasswordValid = validatePassword(password)
    const isConfirmPasswordValid = validateConfirmPassword(confirmPassword, password)
    const isFirstNameValid = validateFirstName(firstName)
    const isLastNameValid = validateLastName(lastName)
    const isPhoneNumberValid = validatePhoneNumber(phoneNumber)

    if (!isEmailValid || !isPasswordValid || !isConfirmPasswordValid || 
        !isFirstNameValid || !isLastNameValid || !isPhoneNumberValid) {
      return
    }

    try {
      await dispatch(
        signUpAsync({
          email: email.trim(),
          password,
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
        })
      ).unwrap()

      // Check if we're using local auth (auto-confirmed users)
      const isLocalAuth = !import.meta.env.VITE_COGNITO_USER_POOL_ID || 
                          import.meta.env.VITE_LOCAL_AUTH_ENABLED === 'true'
      
      if (isLocalAuth) {
        // In local auth mode, automatically sign in the user after signup
        // since there's no email verification needed
        try {
          await dispatch(
            signInAsync({
              email: email.trim(),
              password,
            })
          ).unwrap()
          
          // Sync user to database after successful signup and login
          try {
            await syncUserFromCognito()
            console.log('User synced to database successfully')
          } catch (syncErr) {
            // Log error but don't block navigation - user is still authenticated
            console.error('Failed to sync user to database:', syncErr)
            // The backend will auto-sync when the user accesses their profile
          }
          
          // Navigate to home page after successful auto-login
          navigate('/', { 
            state: { 
              message: 'Account created and signed in successfully!' 
            } 
          })
        } catch (signInErr) {
          // If auto-login fails, redirect to login page
          console.error('Auto-login after signup failed:', signInErr)
          navigate('/login', { 
            state: { 
              message: 'Account created successfully! Please sign in.' 
            } 
          })
        }
      } else {
        // In real Cognito mode, redirect to login (user needs to verify email)
        // User will be synced to database on first login
        navigate('/login', { 
          state: { 
            message: 'Account created successfully! Please check your email to verify your account.' 
          } 
        })
      }
    } catch (err) {
      // Error is handled by Redux state
      console.error('Sign up failed:', err)
      // Don't navigate on error - let user see the error message and try again
      // The error will be displayed in the form via Redux state
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4 py-8">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-center">
            Create Account
          </CardTitle>
          <CardDescription className="text-center">
            Enter your information to create a new account
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit} noValidate>
          <CardContent className="space-y-4">
            {/* First Name Input */}
            <div className="space-y-2">
              <label
                htmlFor="firstName"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                First Name
              </label>
              <Input
                id="firstName"
                type="text"
                placeholder="John"
                value={firstName}
                onChange={(e) => {
                  setFirstName(e.target.value)
                  if (firstNameError) {
                    validateFirstName(e.target.value)
                  }
                }}
                onBlur={() => validateFirstName(firstName)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!firstNameError}
                aria-describedby={firstNameError ? 'firstName-error' : undefined}
                autoComplete="given-name"
                autoFocus
              />
              {firstNameError && (
                <p
                  id="firstName-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {firstNameError}
                </p>
              )}
            </div>

            {/* Last Name Input */}
            <div className="space-y-2">
              <label
                htmlFor="lastName"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Last Name
              </label>
              <Input
                id="lastName"
                type="text"
                placeholder="Doe"
                value={lastName}
                onChange={(e) => {
                  setLastName(e.target.value)
                  if (lastNameError) {
                    validateLastName(e.target.value)
                  }
                }}
                onBlur={() => validateLastName(lastName)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!lastNameError}
                aria-describedby={lastNameError ? 'lastName-error' : undefined}
                autoComplete="family-name"
              />
              {lastNameError && (
                <p
                  id="lastName-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {lastNameError}
                </p>
              )}
            </div>

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

            {/* Phone Number Input */}
            <div className="space-y-2">
              <label
                htmlFor="phoneNumber"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Phone Number <span className="text-muted-foreground">(optional)</span>
              </label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+1 (555) 123-4567"
                value={phoneNumber}
                onChange={(e) => {
                  setPhoneNumber(e.target.value)
                  if (phoneNumberError) {
                    validatePhoneNumber(e.target.value)
                  }
                }}
                onBlur={() => validatePhoneNumber(phoneNumber)}
                disabled={isLoading}
                aria-invalid={!!phoneNumberError}
                aria-describedby={phoneNumberError ? 'phoneNumber-error' : undefined}
                autoComplete="tel"
              />
              {phoneNumberError && (
                <p
                  id="phoneNumber-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {phoneNumberError}
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
                onChange={(e) => {
                  setPassword(e.target.value)
                  if (passwordError) {
                    validatePassword(e.target.value)
                  }
                  // Re-validate confirm password if it has a value
                  if (confirmPassword) {
                    validateConfirmPassword(confirmPassword, e.target.value)
                  }
                }}
                onBlur={() => validatePassword(password)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!passwordError}
                aria-describedby={passwordError ? 'password-error' : undefined}
                autoComplete="new-password"
              />
              {/* Password Strength Indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${getPasswordStrengthColor(passwordStrength)}`}
                        style={{ width: passwordStrength === 'weak' ? '25%' : passwordStrength === 'fair' ? '50%' : passwordStrength === 'good' ? '75%' : '100%' }}
                        role="progressbar"
                        aria-valuenow={passwordStrength === 'weak' ? 25 : passwordStrength === 'fair' ? 50 : passwordStrength === 'good' ? 75 : 100}
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-label={`Password strength: ${getPasswordStrengthText(passwordStrength)}`}
                      />
                    </div>
                    <span className={`text-xs font-medium ${
                      passwordStrength === 'weak' ? 'text-destructive' :
                      passwordStrength === 'fair' ? 'text-orange-500' :
                      passwordStrength === 'good' ? 'text-yellow-500' :
                      'text-green-500'
                    }`}>
                      {getPasswordStrengthText(passwordStrength)}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Password must be at least 8 characters and include uppercase, lowercase, number, and special character
                  </p>
                </div>
              )}
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

            {/* Confirm Password Input */}
            <div className="space-y-2">
              <label
                htmlFor="confirmPassword"
                className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
              >
                Confirm Password
              </label>
              <Input
                id="confirmPassword"
                type="password"
                placeholder="Confirm your password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value)
                  if (confirmPasswordError) {
                    validateConfirmPassword(e.target.value, password)
                  }
                }}
                onBlur={() => validateConfirmPassword(confirmPassword, password)}
                disabled={isLoading}
                required
                aria-required="true"
                aria-invalid={!!confirmPasswordError}
                aria-describedby={confirmPasswordError ? 'confirmPassword-error' : undefined}
                autoComplete="new-password"
              />
              {confirmPasswordError && (
                <p
                  id="confirmPassword-error"
                  className="text-sm text-destructive"
                  role="alert"
                  aria-live="polite"
                >
                  {confirmPasswordError}
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
                  <span className="sr-only">Creating account...</span>
                  <span aria-hidden="true">Creating account...</span>
                </>
              ) : (
                'Create Account'
              )}
            </Button>
            <div className="text-center text-sm">
              <span className="text-muted-foreground">
                Already have an account?{' '}
              </span>
              <Link
                to="/login"
                className="text-primary hover:underline focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 rounded"
              >
                Sign in
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}

export default SignUp

