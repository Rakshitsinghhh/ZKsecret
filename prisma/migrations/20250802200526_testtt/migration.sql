/*
  Warnings:

  - Changed the type of `hash` on the `User` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "public"."User" DROP COLUMN "hash",
ADD COLUMN     "hash" BIGINT NOT NULL;
