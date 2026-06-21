-- CreateEnum
CREATE TYPE "InterviewSessionStatus" AS ENUM ('GENERATING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "InterviewQuestionCategory" AS ENUM ('BEHAVIORAL', 'TECHNICAL', 'ROLE_FIT', 'COMPANY', 'GAP', 'LOGISTICS');

-- CreateEnum
CREATE TYPE "InterviewPracticeStatus" AS ENUM ('NOT_STARTED', 'ANSWERED', 'REVIEWED');

-- CreateTable
CREATE TABLE "InterviewSession" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "applicationId" TEXT NOT NULL,
    "status" "InterviewSessionStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "readinessScore" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewSession_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InterviewQuestion" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "category" "InterviewQuestionCategory" NOT NULL DEFAULT 'BEHAVIORAL',
    "question" TEXT NOT NULL,
    "rationale" TEXT,
    "talkingPoints" TEXT[],
    "userAnswer" TEXT,
    "feedback" TEXT,
    "improvedAnswer" TEXT,
    "keyPoints" TEXT[],
    "score" INTEGER,
    "selfRating" INTEGER,
    "practiceStatus" "InterviewPracticeStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "savedTemplateId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "InterviewQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "InterviewSession_userId_idx" ON "InterviewSession"("userId");

-- CreateIndex
CREATE INDEX "InterviewSession_applicationId_idx" ON "InterviewSession"("applicationId");

-- CreateIndex
CREATE INDEX "InterviewQuestion_sessionId_idx" ON "InterviewQuestion"("sessionId");

-- CreateIndex
CREATE INDEX "InterviewQuestion_userId_idx" ON "InterviewQuestion"("userId");

-- AddForeignKey
ALTER TABLE "InterviewSession" ADD CONSTRAINT "InterviewSession_applicationId_fkey" FOREIGN KEY ("applicationId") REFERENCES "Application"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InterviewQuestion" ADD CONSTRAINT "InterviewQuestion_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "InterviewSession"("id") ON DELETE CASCADE ON UPDATE CASCADE;
