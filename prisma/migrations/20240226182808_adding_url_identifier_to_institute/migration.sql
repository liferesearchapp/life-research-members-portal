/*
  Warnings:

  - A unique constraint covering the columns `[urlIdentifier]` on the table `institute` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `urlIdentifier` to the `institute` table without a default value. This is not possible if the table is not empty.

*/
BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[institute] ADD [urlIdentifier] NVARCHAR(1000) NOT NULL;

-- CreateIndex
ALTER TABLE [dbo].[institute] ADD CONSTRAINT [institute_urlIdentifier_key] UNIQUE NONCLUSTERED ([urlIdentifier]);

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
