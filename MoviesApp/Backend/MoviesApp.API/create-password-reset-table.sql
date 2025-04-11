-- Check if table exists and create if it doesn't
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'[dbo].[password_reset_tokens]') AND type in (N'U'))
BEGIN
    CREATE TABLE [dbo].[password_reset_tokens] (
        [id] INT IDENTITY(1,1) NOT NULL,
        [user_id] INT NOT NULL,
        [token] NVARCHAR(MAX) NOT NULL,
        [expiry_date] DATETIME2 NOT NULL,
        [is_used] BIT NOT NULL DEFAULT 0,
        CONSTRAINT [PK_password_reset_tokens] PRIMARY KEY ([id])
    );

    -- Create foreign key constraint
    ALTER TABLE [dbo].[password_reset_tokens] 
    ADD CONSTRAINT [FK_password_reset_tokens_movies_users_user_id] 
    FOREIGN KEY ([user_id]) 
    REFERENCES [dbo].[movies_users] ([user_id])
    ON DELETE CASCADE;

    -- Create index
    CREATE INDEX [IX_password_reset_tokens_user_id] ON [dbo].[password_reset_tokens] ([user_id]);
END
