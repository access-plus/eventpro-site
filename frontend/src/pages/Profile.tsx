import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAppSelector } from '@/store/hooks'
import { selectIsAuthenticated, selectUser } from '@/store/slices/authSlice'
import ProtectedRoute from '@/components/common/ProtectedRoute'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Separator } from '@/components/ui/separator'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card'
import {
  userService,
  type UserProfile,
  type UpdateUserProfileRequest,
} from '@/services/userService'
import { Mail, User, Phone, Shield, Edit2, Save, X, CheckCircle2 } from 'lucide-react'

/**
 * Profile page component.
 *
 * Displays and allows editing of the current user's profile information.
 * Features:
 * - Elegant profile header with avatar
 * - Read-only view of user information with icons
 * - Edit form for firstName, lastName, phoneNumber
 * - Form validation
 * - Loading states with skeleton
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
   * Gets user initials for avatar.
   */
  const getUserInitials = (): string => {
    if (profile?.firstName && profile?.lastName && profile.firstName.length > 0 && profile.lastName.length > 0) {
      return `${profile.firstName[0]}${profile.lastName[0]}`.toUpperCase()
    }
    if (profile?.email && profile.email.length > 0) {
      const firstChar = profile.email[0]
      return firstChar ? firstChar.toUpperCase() : 'U'
    }
    return 'U'
  }

  /**
   * Gets full name or email.
   */
  const getDisplayName = (): string => {
    if (profile?.firstName && profile?.lastName) {
      return `${profile.firstName} ${profile.lastName}`
    }
    if (profile?.firstName) {
      return profile.firstName
    }
    return profile?.email || 'User'
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
      
      // Clear success message after 5 seconds
      setTimeout(() => setSuccessMessage(null), 5000)
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
      <div className="min-h-screen bg-background p-4 py-8">
        <div className="container mx-auto max-w-4xl">
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-64" />
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Skeleton className="h-20 w-20 rounded-full" />
                <div className="space-y-2">
                  <Skeleton className="h-6 w-48" />
                  <Skeleton className="h-4 w-64" />
                </div>
              </div>
              <Separator />
              <div className="space-y-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
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
        <div className="container mx-auto max-w-4xl">
          <Card className="overflow-hidden">
            {/* Profile Header with Avatar */}
            <div className="bg-gradient-to-br from-primary/10 via-primary/5 to-background p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                {/* Avatar */}
                <div className="relative">
                  <div className="h-24 w-24 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white text-2xl font-bold shadow-lg">
                    {getUserInitials()}
                  </div>
                  {!isEditing && (
                    <div className="absolute bottom-0 right-0 h-6 w-6 rounded-full bg-green-500 border-4 border-background"></div>
                  )}
                </div>
                
                {/* User Info */}
                <div className="flex-1">
                  <h1 className="text-3xl font-bold mb-2">{getDisplayName()}</h1>
                  <p className="text-muted-foreground flex items-center gap-2">
                    <Mail className="h-4 w-4" />
                    {profile.email}
                  </p>
                  {cognitoUser?.groups && cognitoUser.groups.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {cognitoUser.groups.map((group) => (
                        <span
                          key={group}
                          className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                        >
                          <Shield className="h-3 w-3" />
                          {group}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Edit Button */}
                {!isEditing && (
                  <Button onClick={handleEdit} type="button" className="gap-2">
                    <Edit2 className="h-4 w-4" />
                    Edit Profile
                  </Button>
                )}
              </div>
            </div>

            <CardContent className="p-8">
              {/* Success Message */}
              {successMessage && (
                <div
                  className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 mb-6 flex items-center gap-2 text-green-700 dark:text-green-400"
                  role="alert"
                  aria-live="polite"
                >
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">{successMessage}</span>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div
                  className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 mb-6 text-destructive"
                  role="alert"
                  aria-live="assertive"
                >
                  {error}
                </div>
              )}

              {!isEditing ? (
                // Read-only view
                <div className="space-y-6">
                  <div className="grid gap-6">
                    {/* Email */}
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-lg bg-muted">
                        <Mail className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Email Address
                        </label>
                        <div className="text-base font-medium">{profile.email}</div>
                        <p className="text-xs text-muted-foreground mt-1">
                          Your email address cannot be changed
                        </p>
                      </div>
                    </div>

                    <Separator />

                    {/* First Name */}
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-lg bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          First Name
                        </label>
                        <div className="text-base font-medium">
                          {profile.firstName || (
                            <span className="text-muted-foreground italic">Not set</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Last Name */}
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-lg bg-muted">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Last Name
                        </label>
                        <div className="text-base font-medium">
                          {profile.lastName || (
                            <span className="text-muted-foreground italic">Not set</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Phone Number */}
                    <div className="flex items-start gap-4">
                      <div className="mt-1 p-2 rounded-lg bg-muted">
                        <Phone className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div className="flex-1">
                        <label className="text-sm font-medium text-muted-foreground mb-1 block">
                          Phone Number
                        </label>
                        <div className="text-base font-medium">
                          {profile.phoneNumber || (
                            <span className="text-muted-foreground italic">Not set</span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                // Edit form
                <form onSubmit={handleSubmit} className="space-y-6" noValidate>
                  {/* Email (read-only) */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-muted">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor="email"
                        className="text-sm font-medium leading-none"
                      >
                        Email Address
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
                  </div>

                  <Separator />

                  {/* First Name */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor="firstName"
                        className="text-sm font-medium leading-none"
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
                        className={firstNameError ? 'border-destructive' : ''}
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
                  </div>

                  <Separator />

                  {/* Last Name */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-muted">
                      <User className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor="lastName"
                        className="text-sm font-medium leading-none"
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
                        className={lastNameError ? 'border-destructive' : ''}
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
                  </div>

                  <Separator />

                  {/* Phone Number */}
                  <div className="flex items-start gap-4">
                    <div className="mt-1 p-2 rounded-lg bg-muted">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="flex-1 space-y-2">
                      <label
                        htmlFor="phoneNumber"
                        className="text-sm font-medium leading-none"
                      >
                        Phone Number{' '}
                        <span className="text-muted-foreground font-normal">(optional)</span>
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
                        className={phoneNumberError ? 'border-destructive' : ''}
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
                  </div>
                </form>
              )}
            </CardContent>

            {/* Footer with Action Buttons */}
            {isEditing && (
              <CardFooter className="flex justify-end gap-3 p-6 bg-muted/30 border-t">
                <Button
                  onClick={handleCancel}
                  type="button"
                  variant="outline"
                  disabled={isSaving}
                  className="gap-2"
                >
                  <X className="h-4 w-4" />
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
                  className="gap-2"
                >
                  {isSaving ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  )
}

export default Profile
