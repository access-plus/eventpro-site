# Cognito Admin Users
# Creates 3 admin users and assigns them to the ADMIN group
# Note: Only application owners can be admins, created via infrastructure

resource "aws_cognito_user" "admin_users" {
  for_each = {
    admin1 = {
      email       = "admin1@eventpro.com"
      first_name  = "Admin"
      last_name   = "One"
      phone_number = "+12345678901" # Optional: Update with actual phone numbers
    }
    admin2 = {
      email       = "admin2@eventpro.com"
      first_name  = "Admin"
      last_name   = "Two"
      phone_number = "+12345678902" # Optional: Update with actual phone numbers
    }
    admin3 = {
      email       = "admin3@eventpro.com"
      first_name  = "Admin"
      last_name   = "Three"
      phone_number = "+12345678903" # Optional: Update with actual phone numbers
    }
  }

  user_pool_id = module.cognito.user_pool_id
  username     = each.value.email

  attributes = merge(
    {
      email       = each.value.email
      given_name  = each.value.first_name
      family_name = each.value.last_name
    },
    lookup(each.value, "phone_number", null) != null ? {
      phone_number = each.value.phone_number
    } : {}
  )

  # Users are created in FORCE_CHANGE_PASSWORD status
  # They must change their password on first login
  message_action = "SUPPRESS" # Suppress welcome email (password will be set separately)

  # Temporary password - should be changed on first login
  # In production, use AWS Secrets Manager or similar to store initial passwords
  temporary_password = "TempPassword123!" # TODO: Move to Secrets Manager in production

  lifecycle {
    ignore_changes = [temporary_password]
  }
}

# Assign admin users to ADMIN group
resource "aws_cognito_user_group_membership" "admin_group_membership" {
  for_each = aws_cognito_user.admin_users

  user_pool_id = module.cognito.user_pool_id
  username     = each.value.username
  group_name   = "ADMIN" # Must match the group name defined in cognito module
}

