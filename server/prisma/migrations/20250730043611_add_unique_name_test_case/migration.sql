/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `TestCase` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "TestCase_name_key" ON "TestCase"("name");
