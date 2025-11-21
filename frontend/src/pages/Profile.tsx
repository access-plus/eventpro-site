import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  userService,
  type UserProfile,
  type UpdateUserProfileRequest,
} from '@/services/userService'

/**
 * Profile page component.
 *
 * Displays and allows editing of the current user's profile information.
 * Features:
 * - Read-only view of user information
 * - Edit form for firstName, lastName, phoneNumber
 * - Form validation
 * - Loading states
 * - Success/error messages
 * - Responsive design
 * - Accessibility (WCAG 2.1 AA)
 */
function Profile() {
  const navigate = useNavigate()
  const isAuthenticated = useAppSelector(selectIsAuthenticated)
  const cognitoUser = useAppSelector(selectUser)

  const [profile, setProfile] = useState<UserProfile | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)

  // Form state
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phoneNumber, setPhoneNumber] = useState('')

  // Validation errors
  const [firstNameError, setFirstNameError] = useState('')
  const [lastNameError, setLastNameError] = useState('')
  const [phoneNumberError, setPhoneNumberError] = useState('')

  // Redirect if not authenticated
  if (!isAuthenticated) {
    navigate('/login')
    return null
  }

  /**
   * Loads the user profile from the API.
   */
  useEffect(() => {
    const loadProfile = async () => {
      try {
        setIsLoading(true)
        setError(null)
        const userProfile = await userService.getCurrentUserProfile()
        setProfile(userProfile)
        // Initialize form fields with current values
        setFirstName(userProfile.firstName || '')
        setLastName(userProfile.lastName || '')
        setPhoneNumber(userProfile.phoneNumber || '')
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load user profile'
        )
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [])

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
    if (value.trim().length > 100) {
      setFirstNameError('First name must not exceed 100 characters')
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
    if (value.trim().length > 100) {
      setLastNameError('Last name must not exceed 100 characters')
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
   * Handles edit button click.
   */
  const handleEdit = () => {
    setIsEditing(true)
    setError(null)
    setSuccessMessage(null)
  }

  /**
   * Handles cancel button click.
   */
  const handleCancel = () => {
    setIsEditing(false)
    setError(null)
    setSuccessMessage(null)
    // Reset form to original values
    if (profile) {
      setFirstName(profile.firstName || '')
      setLastName(profile.lastName || '')
      setPhoneNumber(profile.phoneNumber || '')
    }
    // Clear validation errors
    setFirstNameError('')
    setLastNameError('')
    setPhoneNumberError('')
  }

  /**
   * Handles form submission.
   */
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()

    // Clear previous messages
    setError(null)
    setSuccessMessage(null)

    // Validate form fields
    const isFirstNameValid = validateFirstName(firstName)
    const isLastNameValid = validateLastName(lastName)
    const isPhoneNumberValid = validatePhoneNumber(phoneNumber)

    if (!isFirstNameValid || !isLastNameValid || !isPhoneNumberValid) {
      return
    }

    try {
      setIsSaving(true)

      const updateRequest: UpdateUserProfileRequest = {
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phoneNumber: phoneNumber.trim() || null,
      }

      const updatedProfile = await userService.updateUserProfile(updateRequest)
      setProfile(updatedProfile)
      setIsEditing(false)
      setSuccessMessage('Profile updated successfully!')
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to update profile'
      )
    } finally {
      setIsSaving(false)
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center">Loading profile...</div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <Card className="w-full max-w-2xl">
          <CardContent className="pt-6">
            <div className="text-center text-destructive">
              {error || 'Failed to load profile'}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background p-4 py-8">
        <div className="container mx-auto max-w-2xl">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Profile</CardTitle>
              <CardDescription>
                View and manage your account information
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!isEditing ? (
                // Read-only view
                <div className="space-y-4">
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Email
                    </label>
                    <div className="text-base">{profile.email}</div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      First Name
                    </label>
                    <div className="text-base">
                      {profile.firstName || 'Not set'}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Last Name
                    </label>
                    <div className="text-base">
                      {profile.lastName || 'Not set'}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <label className="text-sm font-medium text-muted-foreground">
                      Phone Number
                    </label>
                    <div className="text-base">
                      {profile.phoneNumber || 'Not set'}
                    </div>
                  </div>
                  {cognitoUser?.groups && cognitoUser.groups.length > 0 && (
                    <div className="grid gap-2">
                      <label className="text-sm font-medium text-muted-foreground">
                        Roles
                      </label>
                      <div className="flex flex-wrap gap-2">
                        {cognitoUser.groups.map((group) => (
                          <span
                            key={group}
                            className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary"
                          >
                            {group}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                // Edit form
                <form onSubmit={handleSubmit} className="space-y-4" noValidate>
                  <div className="grid gap-2">
                    <label
                      htmlFor="email"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Email
                    </label>
                    <Input
                      id="email"
                      type="email"
                      value={profile.email}
                      disabled
                      className="bg-muted"
                      aria-label="Email (read-only)"
                    />
                    <p className="text-xs text-muted-foreground">
                      Email cannot be changed
                    </p>
                  </div>

                  <div className="grid gap-2">
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
                      disabled={isSaving}
                      required
                      aria-required="true"
                      aria-invalid={!!firstNameError}
                      aria-describedby={firstNameError ? 'firstName-error' : undefined}
                      autoComplete="given-name"
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

                  <div className="grid gap-2">
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
                      disabled={isSaving}
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

                  <div className="grid gap-2">
                    <label
                      htmlFor="phoneNumber"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      Phone Number{' '}
                      <span className="text-muted-foreground">(optional)</span>
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
                      disabled={isSaving}
                      aria-invalid={!!phoneNumberError}
                      aria-describedby={
                        phoneNumberError ? 'phoneNumber-error' : undefined
                      }
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

                  {error && (
                    <div
                      className="rounded-md bg-destructive/15 p-3 text-sm text-destructive"
                      role="alert"
                      aria-live="assertive"
                    >
                      {error}
                    </div>
                  )}

                  {successMessage && (
                    <div
                      className="rounded-md bg-green-500/15 p-3 text-sm text-green-700 dark:text-green-400"
                      role="alert"
                      aria-live="polite"
                    >
                      {successMessage}
                    </div>
                  )}
                </form>
              )}
            </CardContent>
            <CardFooter className="flex justify-end gap-2">
              {!isEditing ? (
                <Button onClick={handleEdit} type="button">
                  Edit Profile
                </Button>
              ) : (
                <>
                  <Button
                    onClick={handleCancel}
                    type="button"
                    variant="outline"
                    disabled={isSaving}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={(e) => {
                      const form = e.currentTarget.closest('form')
                      if (form) {
                        form.requestSubmit()
                      }
                    }}
                    type="submit"
                    disabled={isSaving}
                    aria-busy={isSaving}
                  >
                    {isSaving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </>
              )}
            </CardFooter>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Profile

