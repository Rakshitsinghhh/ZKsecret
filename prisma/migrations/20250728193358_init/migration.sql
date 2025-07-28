-- CreateTable
CREATE TABLE "User" (
    "id" SERIAL NOT NULL,
    "UserId" TEXT NOT NULL,
    "password" TEXT NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_UserId_key" ON "User"("UserId");
