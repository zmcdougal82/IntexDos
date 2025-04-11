# Password Reset Functionality

This document describes the password reset functionality implemented in the MoviesApp API, which uses Mailgun for email delivery.

## Configuration

The Mailgun email service has been configured with the following credentials:

- API Key: `7366e6734f1c23f0db1fee6d258575cd-2b77fbb2-d23dd854`
- Sending Domain: `send.cineniche.co`
- Sender Email: `noreply@send.cineniche.co`

These settings are stored in the `appsettings.json` file under the `Mailgun` section.

## How Password Reset Works

1. **Forgot Password Request**: User submits their email through the "Forgot Password" feature.
2. **Token Generation**: The system generates a secure token and stores it in the database.
3. **Email Delivery**: An email with a password reset link is sent to the user via Mailgun.
4. **Reset Password**: User clicks the link in the email and is directed to a page where they can enter a new password.
5. **Password Update**: The system verifies the token and updates the user's password.

## Testing the Password Reset Flow

We've created several scripts to help test the Mailgun password reset functionality:

### 1. `test-mailgun-forgot-password.js`

This script initiates the password reset process by sending a "forgot password" request to the API.

Usage:
```
node MoviesApp/Backend/test-mailgun-forgot-password.js [email]
```

### 2. `test-mailgun-reset-password.js`

This script completes the password reset process by submitting a new password along with the token received in the email.

Usage:
```
node MoviesApp/Backend/test-mailgun-reset-password.js [email] [token] [newPassword]
```

If you don't provide the parameters, the script will prompt you for them interactively.

### 3. `test-mailgun-reset-flow.sh`

This is a convenience script that automates the entire testing process:

Usage:
```
./MoviesApp/Backend/test-mailgun-reset-flow.sh
```

The script will:
- Start the API in development mode in a new terminal window
- Prompt for the email to test
- Run the forgot password test
- Display instructions for completing the reset process

## Development vs Production

For development and testing purposes, the system uses a mock email service that prints the password reset link directly to the console instead of sending a real email.

When running in development mode:
- No actual email is sent
- The password reset link is printed directly to the console
- You can copy this link to test the password reset flow

In production (Azure):
- The system uses Mailgun to send real emails to users
- The domain (send.cineniche.co) has been verified in Mailgun
- Emails will be delivered to users' inboxes, including the password reset link

## Database Table

The password reset functionality uses a dedicated table in the database:

```sql
CREATE TABLE [dbo].[password_reset_tokens] (
    [id] INT IDENTITY(1,1) NOT NULL,
    [user_id] INT NOT NULL,
    [token] NVARCHAR(MAX) NOT NULL,
    [expiry_date] DATETIME2 NOT NULL,
    [is_used] BIT NOT NULL DEFAULT 0,
    CONSTRAINT [PK_password_reset_tokens] PRIMARY KEY ([id])
);
```

Tokens are set to expire after 1 hour and are marked as used once a password has been reset.
