# Password Reset Functionality

This document describes the password reset functionality implemented in the MoviesApp API, which uses SparkPost for email delivery.

## Configuration

The SparkPost email service has been configured with the following credentials:

- API Key: `aecf07103eecf75d6ee809bb0e19a2f7de099dba`
- Sending Domain: `mail.cineniche.co`
- Sender Email: `noreply@mail.cineniche.co`

These settings are stored in the `appsettings.json` file under the `SparkPost` section.

## How Password Reset Works

1. **Forgot Password Request**: User submits their email through the "Forgot Password" feature.
2. **Token Generation**: The system generates a secure token and stores it in the database.
3. **Email Delivery**: An email with a password reset link is sent to the user via SparkPost.
4. **Reset Password**: User clicks the link in the email and is directed to a page where they can enter a new password.
5. **Password Update**: The system verifies the token and updates the user's password.

## Testing the Password Reset Flow

Three scripts have been created to help test the password reset functionality:

### 1. `test-forgot-password.js`

This script initiates the password reset process by sending a "forgot password" request to the API.

Usage:
```
node MoviesApp/Backend/test-forgot-password.js
```

### 2. `test-reset-password.js`

This script completes the password reset process by submitting a new password along with the token received in the email.

Usage:
1. Edit the script to include your email, the token received, and the new password
2. Run:
```
node MoviesApp/Backend/test-reset-password.js
```

### 3. `start-api-and-test-reset.sh`

This is a convenience script that starts the API in development mode and runs the forgot password test.

Usage:
```
./MoviesApp/Backend/start-api-and-test-reset.sh
```

The script will:
- Install required npm packages
- Prompt for the email to test
- Start the API in development mode
- Run the forgot password test
- Display instructions for completing the reset process

## Development vs Production

In development mode, the password reset link will be printed to the console for easy testing. In production, the link will only be sent via email.

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
