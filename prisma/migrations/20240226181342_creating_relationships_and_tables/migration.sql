/*
  Warnings:

  - Added the required column `instituteId` to the `event` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituteId` to the `grant` table without a default value. This is not possible if the table is not empty.
  - Added the required column `instituteId` to the `supervision` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[account] ADD [is_super_admin] BIT NOT NULL CONSTRAINT [DF_account_is_super_admin] DEFAULT 0;

-- AlterTable
ALTER TABLE [dbo].[event] ADD [instituteId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[grant] ADD [instituteId] INT NOT NULL;

-- AlterTable
ALTER TABLE [dbo].[supervision] ADD [instituteId] INT NOT NULL;

-- CreateTable
CREATE TABLE [dbo].[institute] (
    [id] INT NOT NULL IDENTITY(1,1),
    [name] NVARCHAR(1000) NOT NULL,
    [domain] NVARCHAR(1000),
    CONSTRAINT [institute_pkey] PRIMARY KEY CLUSTERED ([id]),
    CONSTRAINT [institute_name_key] UNIQUE NONCLUSTERED ([name])
);

-- CreateTable
CREATE TABLE [dbo].[memberInstitute] (
    [memberId] INT NOT NULL,
    [instituteId] INT NOT NULL,
    CONSTRAINT [memberInstitute_pkey] PRIMARY KEY CLUSTERED ([memberId],[instituteId])
);

-- CreateTable
CREATE TABLE [dbo].[productInstitute] (
    [productId] INT NOT NULL,
    [instituteId] INT NOT NULL,
    CONSTRAINT [productInstitute_pkey] PRIMARY KEY CLUSTERED ([productId],[instituteId])
);

-- CreateTable
CREATE TABLE [dbo].[OrganizationInstitute] (
    [organizationId] INT NOT NULL,
    [instituteId] INT NOT NULL,
    CONSTRAINT [OrganizationInstitute_pkey] PRIMARY KEY CLUSTERED ([organizationId],[instituteId])
);

-- AddForeignKey
ALTER TABLE [dbo].[memberInstitute] ADD CONSTRAINT [memberInstitute_memberId_fkey] FOREIGN KEY ([memberId]) REFERENCES [dbo].[member]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[memberInstitute] ADD CONSTRAINT [memberInstitute_instituteId_fkey] FOREIGN KEY ([instituteId]) REFERENCES [dbo].[institute]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[productInstitute] ADD CONSTRAINT [productInstitute_productId_fkey] FOREIGN KEY ([productId]) REFERENCES [dbo].[product]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[productInstitute] ADD CONSTRAINT [productInstitute_instituteId_fkey] FOREIGN KEY ([instituteId]) REFERENCES [dbo].[institute]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrganizationInstitute] ADD CONSTRAINT [OrganizationInstitute_organizationId_fkey] FOREIGN KEY ([organizationId]) REFERENCES [dbo].[organization]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[OrganizationInstitute] ADD CONSTRAINT [OrganizationInstitute_instituteId_fkey] FOREIGN KEY ([instituteId]) REFERENCES [dbo].[institute]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[event] ADD CONSTRAINT [event_instituteId_fkey] FOREIGN KEY ([instituteId]) REFERENCES [dbo].[institute]([id]) ON DELETE NO ACTION ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[grant] ADD CONSTRAINT [grant_instituteId_fkey] FOREIGN KEY ([instituteId]) REFERENCES [dbo].[institute]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE [dbo].[supervision] ADD CONSTRAINT [supervision_instituteId_fkey] FOREIGN KEY ([instituteId]) REFERENCES [dbo].[institute]([id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
