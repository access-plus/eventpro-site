# Cognito Module - Main Configuration
# This module creates a Cognito User Pool with custom attributes, groups, and client configuration

# Cognito User Pool
resource "aws_cognito_user_pool" "main" {
  name = "${var.name_prefix}-user-pool"

  # Account Recovery Settings
  account_recovery_setting {
    dynamic "recovery_mechanism" {
      for_each = var.account_recovery_mechanisms
      content {
        name     = recovery_mechanism.value.name
        priority = recovery_mechanism.value.priority
      }
    }
  }

  # Admin Create User Configuration
  admin_create_user_config {
    allow_admin_create_user_only = var.allow_admin_create_user_only

    dynamic "invite_message_template" {
      for_each = var.invite_message_template != null ? [1] : []
      content {
        email_message = var.invite_message_template.email_message
        email_subject = var.invite_message_template.email_subject
        sms_message  = var.invite_message_template.sms_message
      }
    }
  }

  # Alias Attributes
  alias_attributes = var.alias_attributes

  # Auto Verified Attributes
  auto_verified_attributes = var.auto_verified_attributes

  # Deletion Protection
  deletion_protection = var.deletion_protection

  # Email Configuration
  dynamic "email_configuration" {
    for_each = var.email_configuration != null ? [1] : []
    content {
      configuration_set      = var.email_configuration.configuration_set
      email_sending_account  = var.email_configuration.email_sending_account
      from_email_address     = var.email_configuration.from_email_address
      reply_to_email_address = var.email_configuration.reply_to_email_address
      source_arn             = var.email_configuration.source_arn
    }
  }

  # Email Verification Messages
  email_verification_message = var.email_verification_message
  email_verification_subject = var.email_verification_subject

  # MFA Configuration
  mfa_configuration = var.mfa_configuration

  # Email MFA Configuration
  dynamic "email_mfa_configuration" {
    for_each = var.email_mfa_configuration != null ? [1] : []
    content {
      message = var.email_mfa_configuration.message
      subject = var.email_mfa_configuration.subject
    }
  }

  # SMS Configuration
  dynamic "sms_configuration" {
    for_each = var.sms_configuration != null ? [1] : []
    content {
      external_id    = var.sms_configuration.external_id
      sns_caller_arn = var.sms_configuration.sns_caller_arn
      sns_region     = var.sms_configuration.sns_region
    }
  }

  sms_authentication_message = var.sms_authentication_message
  sms_verification_message   = var.sms_verification_message

  # Software Token MFA Configuration
  dynamic "software_token_mfa_configuration" {
    for_each = var.software_token_mfa_configuration != null ? [1] : []
    content {
      enabled = var.software_token_mfa_configuration.enabled
    }
  }

  # Password Policy
  password_policy {
    minimum_length                   = var.password_policy.minimum_length
    require_lowercase                = var.password_policy.require_lowercase
    require_numbers                  = var.password_policy.require_numbers
    require_symbols                 = var.password_policy.require_symbols
    require_uppercase                = var.password_policy.require_uppercase
    temporary_password_validity_days = var.password_policy.temporary_password_validity_days
  }

  # Schema - Custom Attributes for Roles
  dynamic "schema" {
    for_each = var.custom_attributes
    content {
      name                     = schema.value.name
      attribute_data_type      = schema.value.attribute_data_type
      developer_only_attribute = schema.value.developer_only_attribute
      mutable                  = schema.value.mutable
      required                 = schema.value.required

      dynamic "string_attribute_constraints" {
        for_each = schema.value.attribute_data_type == "String" ? [1] : []
        content {
          min_length = schema.value.string_constraints != null ? schema.value.string_constraints.min_length : 0
          max_length = schema.value.string_constraints != null ? schema.value.string_constraints.max_length : 2048
        }
      }

      dynamic "number_attribute_constraints" {
        for_each = schema.value.attribute_data_type == "Number" ? [1] : []
        content {
          min_value = schema.value.number_constraints != null ? schema.value.number_constraints.min_value : null
          max_value = schema.value.number_constraints != null ? schema.value.number_constraints.max_value : null
        }
      }
    }
  }

  # Username Configuration
  dynamic "username_configuration" {
    for_each = var.username_configuration != null ? [1] : []
    content {
      case_sensitive = var.username_configuration.case_sensitive
    }
  }

  # Verification Message Template
  dynamic "verification_message_template" {
    for_each = var.verification_message_template != null ? [1] : []
    content {
      default_email_option = var.verification_message_template.default_email_option
      email_message        = var.verification_message_template.email_message
      email_message_by_link = var.verification_message_template.email_message_by_link
      email_subject        = var.verification_message_template.email_subject
      email_subject_by_link = var.verification_message_template.email_subject_by_link
      sms_message          = var.verification_message_template.sms_message
    }
  }

  tags = merge(
    var.tags,
    {
      Name = "${var.name_prefix}-user-pool"
    }
  )
}

# Cognito User Pool Client
resource "aws_cognito_user_pool_client" "main" {
  name         = "${var.name_prefix}-client"
  user_pool_id = aws_cognito_user_pool.main.id

  generate_secret = var.client_generate_secret

  # OAuth Configuration
  allowed_oauth_flows_user_pool_client = var.allowed_oauth_flows_user_pool_client
  allowed_oauth_flows                  = var.allowed_oauth_flows
  allowed_oauth_scopes                 = var.allowed_oauth_scopes
  callback_urls                        = var.callback_urls
  logout_urls                          = var.logout_urls
  default_redirect_uri                 = var.default_redirect_uri

  # Supported Identity Providers
  supported_identity_providers = var.supported_identity_providers

  # Explicit Auth Flows
  explicit_auth_flows = var.explicit_auth_flows

  # Token Validity
  access_token_validity = var.access_token_validity
  id_token_validity     = var.id_token_validity
  refresh_token_validity = var.refresh_token_validity

  # Token Validity Units
  dynamic "token_validity_units" {
    for_each = var.token_validity_units != null ? [1] : []
    content {
      access_token  = var.token_validity_units.access_token
      id_token      = var.token_validity_units.id_token
      refresh_token = var.token_validity_units.refresh_token
    }
  }

  # Read/Write Attributes
  read_attributes  = var.read_attributes
  write_attributes = var.write_attributes

  # Prevent User Existence Errors
  prevent_user_existence_errors = var.prevent_user_existence_errors

  # Enable Token Revocation
  enable_token_revocation = var.enable_token_revocation

  # Refresh Token Rotation
  dynamic "refresh_token_rotation" {
    for_each = var.refresh_token_rotation != null ? [1] : []
    content {
      feature                  = var.refresh_token_rotation.feature
      retry_grace_period_seconds = var.refresh_token_rotation.retry_grace_period_seconds
    }
  }
}

# Cognito User Pool Domain
resource "aws_cognito_user_pool_domain" "main" {
  count = var.domain != null ? 1 : 0

  domain       = var.domain
  user_pool_id = aws_cognito_user_pool.main.id

  # Custom Domain with Certificate
  certificate_arn = var.certificate_arn

  # Managed Login Version
  managed_login_version = var.managed_login_version
}

# Cognito User Groups for Roles
resource "aws_cognito_user_group" "roles" {
  for_each = var.user_groups

  name         = each.value.name
  user_pool_id = aws_cognito_user_pool.main.id
  description  = each.value.description
  precedence   = each.value.precedence
  role_arn     = each.value.role_arn
}
