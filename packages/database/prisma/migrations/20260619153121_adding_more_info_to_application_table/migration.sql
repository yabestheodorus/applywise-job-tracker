-- CreateEnum
CREATE TYPE "WorkArrangement" AS ENUM ('REMOTE', 'HYBRID', 'ONSITE');

-- CreateEnum
CREATE TYPE "EmploymentType" AS ENUM ('FULLTIME', 'PARTTIME', 'CONTRACT', 'INTERNSHIP');

-- AlterTable
ALTER TABLE "Application" ADD COLUMN     "employmentType" "EmploymentType",
ADD COLUMN     "industry" TEXT,
ADD COLUMN     "jobUrl" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "seniority" TEXT,
ADD COLUMN     "skills" TEXT[],
ADD COLUMN     "summary" TEXT,
ADD COLUMN     "workArrangement" "WorkArrangement";
