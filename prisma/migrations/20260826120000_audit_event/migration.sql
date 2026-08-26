-- Audit log (issue #16): an append-only record of who did what, when.
--
-- Idempotent, like the other migrations here, so it is safe to re-run and safe against a database
-- initialized straight from schema.prisma.
--
-- No GO separators: the other migrations in this repo have none, and whichever runner applies
-- them may hand the file over as a single batch. CREATE TRIGGER has to start its own batch, so it
-- goes through EXEC below rather than after a GO.

SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'[dbo].[auditEvent]', N'U') IS NULL
  BEGIN
    -- No foreign keys, deliberately. A cascade from [institute] or [account] would erase the
    -- audit trail of the very entity being investigated, and a FK would let the log block a
    -- delete. actor_email is snapshotted for the same reason: the account row may later be gone.
    CREATE TABLE [dbo].[auditEvent] (
      [id]               INT IDENTITY(1,1) NOT NULL,
      [occurred_at]      DATETIME2 NOT NULL
        CONSTRAINT [DF_auditEvent_occurred_at] DEFAULT (SYSUTCDATETIME()),
      [actor_account_id] INT NULL,
      [actor_email]      NVARCHAR(255) NULL,
      [action]           NVARCHAR(200) NOT NULL,
      [target_id]        NVARCHAR(100) NULL,
      [institute_id]     INT NULL,
      [method]           NVARCHAR(10) NOT NULL,
      [status]           INT NOT NULL,
      [detail]           NVARCHAR(MAX) NULL,
      CONSTRAINT [PK_auditEvent] PRIMARY KEY CLUSTERED ([id])
    );
  END;

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_auditEvent_occurred_at')
    CREATE NONCLUSTERED INDEX [IX_auditEvent_occurred_at] ON [dbo].[auditEvent] ([occurred_at]);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_auditEvent_actor')
    CREATE NONCLUSTERED INDEX [IX_auditEvent_actor] ON [dbo].[auditEvent] ([actor_account_id]);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_auditEvent_institute')
    CREATE NONCLUSTERED INDEX [IX_auditEvent_institute] ON [dbo].[auditEvent] ([institute_id]);

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE [name] = N'IX_auditEvent_action')
    CREATE NONCLUSTERED INDEX [IX_auditEvent_action] ON [dbo].[auditEvent] ([action]);

  -- Append-only enforcement.
  --
  -- This is the "secure" in "secure event log": without it, anyone who can reach the database can
  -- edit or erase the record of their own actions, which is precisely the abuse an audit log
  -- exists to expose (issue #12 -- an admin granting themselves rights over a member, acting,
  -- then revoking).
  --
  -- UPDATE is refused outright. DELETE is refused unless the session has deliberately opted in,
  -- which is how a retention purge is meant to run:
  --
  --     EXEC sp_set_session_context @key = N'audit_purge', @value = N'1';
  --     DELETE FROM [dbo].[auditEvent] WHERE [occurred_at] < DATEADD(year, -2, SYSUTCDATETIME());
  --     EXEC sp_set_session_context @key = N'audit_purge', @value = NULL;
  --
  -- The application never sets that key, so no application code path can erase history. A
  -- reviewer who would rather not have a trigger can drop this block; the table and the writes
  -- still work without it.
  IF OBJECT_ID(N'[dbo].[TR_auditEvent_append_only]', N'TR') IS NOT NULL
    DROP TRIGGER [dbo].[TR_auditEvent_append_only];

  EXEC (N'
CREATE TRIGGER [dbo].[TR_auditEvent_append_only]
ON [dbo].[auditEvent]
INSTEAD OF UPDATE, DELETE
AS
BEGIN
  SET NOCOUNT ON;

  -- An UPDATE presents rows in both tables; a DELETE only in [deleted].
  IF EXISTS (SELECT 1 FROM inserted)
  BEGIN
    RAISERROR (N''auditEvent is append-only: rows cannot be modified.'', 16, 1);
    RETURN;
  END;

  IF CONVERT(NVARCHAR(10), SESSION_CONTEXT(N''audit_purge'')) = N''1''
  BEGIN
    DELETE [a]
    FROM [dbo].[auditEvent] AS [a]
    INNER JOIN deleted AS [d] ON [a].[id] = [d].[id];
    RETURN;
  END;

  RAISERROR (N''auditEvent is append-only: a delete requires the audit_purge session flag.'', 16, 1);
END;
');

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
