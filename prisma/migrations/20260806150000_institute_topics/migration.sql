SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID(N'[dbo].[instituteTopic]', N'U') IS NULL
  BEGIN
    CREATE TABLE [dbo].[instituteTopic] (
      [instituteId] INT NOT NULL,
      [topicId] INT NOT NULL,
      [is_active] BIT NOT NULL
        CONSTRAINT [DF_instituteTopic_is_active] DEFAULT (1),
      CONSTRAINT [PK_instituteTopic]
        PRIMARY KEY CLUSTERED ([instituteId], [topicId]),
      CONSTRAINT [FK_instituteTopic_institute]
        FOREIGN KEY ([instituteId]) REFERENCES [dbo].[institute]([id])
        ON DELETE CASCADE,
      CONSTRAINT [FK_instituteTopic_topic]
        FOREIGN KEY ([topicId]) REFERENCES [dbo].[topic]([id])
        ON DELETE CASCADE
    );

    CREATE INDEX [IX_instituteTopic_instituteId_is_active]
      ON [dbo].[instituteTopic]([instituteId], [is_active]);
  END;

  -- Correct only the three known legacy rows whose bilingual values were
  -- imported into the opposite columns. The predicates make this safe to
  -- rerun without swapping already-corrected values back again.
  UPDATE [dbo].[topic]
  SET [name_en] = N'Live long', [name_fr] = N'Vivre longtemps'
  WHERE [id] = 1
    AND [name_en] = N'Vivre longtemps'
    AND [name_fr] = N'Live long';

  UPDATE [dbo].[topic]
  SET [name_en] = N'Live well', [name_fr] = N'Bien vivre'
  WHERE [id] = 2
    AND [name_en] = N'Bien vivre'
    AND [name_fr] = N'Live well';

  UPDATE [dbo].[topic]
  SET [name_en] = N'Live with a voice',
      [name_fr] = N'Vivre avec voix et choix'
  WHERE [id] = 3
    AND [name_en] = N'Vivre avec voix et choix'
    AND [name_fr] = N'Live with a voice';

  -- The legacy topics came from LRI. DLRI and future institutes start with
  -- an empty topic list that their own administrators can manage.
  INSERT INTO [dbo].[instituteTopic] ([instituteId], [topicId], [is_active])
  SELECT i.[id], t.[id], 1
  FROM [dbo].[institute] i
  CROSS JOIN [dbo].[topic] t
  WHERE i.[urlIdentifier] = N'lri'
    AND t.[id] IN (1, 2, 3)
    AND NOT EXISTS (
      SELECT 1
      FROM [dbo].[instituteTopic] existing
      WHERE existing.[instituteId] = i.[id]
        AND existing.[topicId] = t.[id]
    );

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
