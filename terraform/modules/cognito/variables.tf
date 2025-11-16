# Cognito Module - Variables

variable "name_prefix" {
  description = "Prefix for resource names"
  type        = string
}

variable "account_recovery_mechanisms" {
  description = "List of account recovery mechanisms"
  type = list(object({
    name     = string
    priority = number
  }))
  default = [
    {
      name     = "verified_email"
      priority = 1
    },
    {
      name     = "verified_phone_number"
      priority = 2
    }
  ]
}

variable "allow_admin_create_user_only" {
  description = "Set to True if only the administrator is allowed to create user profiles"
  type        = bool
  default     = false
}

variable "invite_message_template" {
  description = "Invite message template structure"
  type = object({
    email_message = optional(string)
    email_subject   = optional(string)
    sms_message    = optional(string)
  })
  default = null
}

variable "alias_attributes" {
  description = "Attributes supported as an alias for this user pool. Valid values: phone_number, email, or preferred_username"
  type        = list(string)
  default     = ["email"]
}

variable "auto_verified_attributes" {
  description = "Attributes to be auto-verified. Valid values: email, phone_number"
  type        = list(string)
  default     = ["email"]
}

variable "deletion_protection" {
  description = "When active, DeletionProtection prevents accidental deletion of your user pool"
  type        = string
  default     = "INACTIVE"
}

variable "email_configuration" {
  description = "Configuration block for configuring email"
  type = object({
    configuration_set      = optional(string)
    email_sending_account  = optional(string, "COGNITO_DEFAULT")
    from_email_address     = optional(string)
    reply_to_email_address = optional(string)
    source_arn             = optional(string)
  })
  default = null
}

variable "email_verification_message" {
  description = "String representing the email verification message"
  type        = string
  default     = "Your verification code is {####}."
}

variable "email_verification_subject" {
  description = "String representing the email verification subject"
  type        = string
  default     = "Your verification code"
}

variable "mfa_configuration" {
  description = "Multi-Factor Authentication (MFA) configuration for the User Pool"
  type        = string
  default     = "OPTIONAL"
}

variable "email_mfa_configuration" {
  description = "Configuration block for configuring email Multi-Factor Authentication (MFA)"
  type = object({
    message = optional(string)
    subject = optional(string)
  })
  default = null
}

variable "sms_configuration" {
  description = "Configuration block for Short Message Service (SMS) settings"
  type = object({
    external_id    = string
    sns_caller_arn = string
    sns_region     = optional(string)
  })
  default = null
}

variable "sms_authentication_message" {
  description = "String representing the SMS authentication message. The Message must contain the {####} placeholder"
  type        = string
  default     = "Your authentication code is {####}."
}

variable "sms_verification_message" {
  description = "String representing the SMS verification message"
  type        = string
  default     = "Your verification code is {####}."
}

variable "software_token_mfa_configuration" {
  description = "Configuration block for software token Multi-Factor Authentication (MFA) settings"
  type = object({
    enabled = bool
  })
  default = null
}

variable "password_policy" {
  description = "Configuration block for information about the user pool password policy"
  type = object({
    minimum_length                   = number
    require_lowercase                = bool
    require_numbers                  = bool
    require_symbols                 = bool
    require_uppercase                = bool
    temporary_password_validity_days = optional(number, 7)
  })
  default = {
    minimum_length                   = 8
    require_lowercase                = true
    require_numbers                  = true
    require_symbols                 = true
    require_uppercase                = true
    temporary_password_validity_days = 7
  }
}

variable "custom_attributes" {
  description = "List of custom schema attributes for the user pool"
  type = list(object({
    name                     = string
    attribute_data_type      = string
    developer_only_attribute = optional(bool, false)
    mutable                  = optional(bool, true)
    required                 = optional(bool, false)
    string_constraints = optional(object({
      min_length = number
      max_length = number
    }))
    number_constraints = optional(object({
      min_value = number
      max_value = number
    }))
  }))
  default = []
}

variable "username_configuration" {
  description = "Configuration block for username configuration"
  type = object({
    case_sensitive = bool
  })
  default = null
}

variable "verification_message_template" {
  description = "Configuration block for verification message templates"
  type = object({
    default_email_option = optional(string, "CONFIRM_WITH_CODE")
    email_message        = optional(string)
    email_message_by_link = optional(string)
    email_subject        = optional(string)
    email_subject_by_link = optional(string)
    sms_message          = optional(string)
  })
  default = null
}

variable "domain" {
  description = "For custom domains, this is the fully-qualified domain name. For Amazon Cognito prefix domains, this is the prefix alone"
  type        = string
  default     = null
}

variable "certificate_arn" {
  description = "The ARN of an ISSUED ACM certificate in us-east-1 for a custom domain"
  type        = string
  default     = null
}

variable "managed_login_version" {
  description = "A version number that indicates the state of managed login for your domain"
  type        = number
  default     = 1
}

variable "client_generate_secret" {
  description = "Boolean flag indicating whether an application secret should be generated"
  type        = bool
  default     = false
}

variable "allowed_oauth_flows_user_pool_client" {
  description = "Whether the client is allowed to use OAuth 2.0 features"
  type        = bool
  default     = true
}

variable "allowed_oauth_flows" {
  description = "List of allowed OAuth flows, including code, implicit, and client_credentials"
  type        = list(string)
  default     = ["code", "implicit"]
}

variable "allowed_oauth_scopes" {
  description = "List of allowed OAuth scopes"
  type        = list(string)
  default     = ["email", "openid", "profile"]
}

variable "callback_urls" {
  description = "List of allowed callback URLs for the identity providers"
  type        = list(string)
  default     = []
}

variable "logout_urls" {
  description = "List of allowed logout URLs for the identity providers"
  type        = list(string)
  default     = []
}

variable "default_redirect_uri" {
  description = "Default redirect URI and must be included in the list of callback URLs"
  type        = string
  default     = null
}

variable "supported_identity_providers" {
  description = "List of provider names for the identity providers that are supported on this client"
  type        = list(string)
  default     = ["COGNITO"]
}

variable "explicit_auth_flows" {
  description = "List of authentication flows"
  type        = list(string)
  default     = ["ALLOW_USER_PASSWORD_AUTH", "ALLOW_USER_SRP_AUTH", "ALLOW_REFRESH_TOKEN_AUTH"]
}

variable "access_token_validity" {
  description = "Time limit, between 5 minutes and 1 day, after which the access token is no longer valid"
  type        = number
  default     = 60 # hours
}

variable "id_token_validity" {
  description = "Time limit, between 5 minutes and 1 day, after which the ID token is no longer valid"
  type        = number
  default     = 60 # hours
}

variable "refresh_token_validity" {
  description = "Time limit, between 60 minutes and 10 years, after which the refresh token is no longer valid"
  type        = number
  default     = 30 # days
}

variable "token_validity_units" {
  description = "Configuration block for representing the validity times in units"
  type = object({
    access_token  = optional(string, "hours")
    id_token      = optional(string, "hours")
    refresh_token = optional(string, "days")
  })
  default = null
}

variable "read_attributes" {
  description = "List of user pool attributes that the application client can read from"
  type        = list(string)
  default     = ["email", "phone_number", "given_name", "family_name"]
}

variable "write_attributes" {
  description = "List of user pool attributes that the application client can write to"
  type        = list(string)
  default     = ["email", "phone_number", "given_name", "family_name"]
}

variable "prevent_user_existence_errors" {
  description = "Setting determines the errors and responses returned by Cognito APIs when a user does not exist"
  type        = string
  default     = "ENABLED"
}

variable "enable_token_revocation" {
  description = "Enables or disables token revocation"
  type        = bool
  default     = true
}

variable "refresh_token_rotation" {
  description = "Configuration block for refresh token rotation"
  type = object({
    feature                  = string
    retry_grace_period_seconds = optional(number, 0)
  })
  default = null
}

variable "user_groups" {
  description = "Map of user groups to create (e.g., ADMIN, ORGANIZER, USER)"
  type = map(object({
    name        = string
    description = string
    precedence  = number
    role_arn    = optional(string)
  }))
  default = {}
}

variable "tags" {
  description = "A map of tags to assign to the resources"
  type        = map(string)
  default     = {}
}

