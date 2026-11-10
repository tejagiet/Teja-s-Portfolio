-- AlterTable
ALTER TABLE "Profile" ADD COLUMN     "previousAboutPhotoUrl" TEXT,
ADD COLUMN     "previousProfilePhotoUrl" TEXT;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "previousImage" TEXT;
