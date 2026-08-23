-- Administrator permissions belong to accounts, independently of membership.
-- The guard also makes this safe for databases initialized from schema.prisma.
IF COL_LENGTH(N'dbo.instituteAdmin', N'memberId') IS NOT NULL
BEGIN
  IF EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE [name] = N'FK_instituteAdmin_memberId'
      AND [parent_object_id] = OBJECT_ID(N'dbo.instituteAdmin')
  )
  BEGIN
    ALTER TABLE [dbo].[instituteAdmin]
    DROP CONSTRAINT [FK_instituteAdmin_memberId];
  END;

  ALTER TABLE [dbo].[instituteAdmin]
  DROP COLUMN [memberId];
END;
