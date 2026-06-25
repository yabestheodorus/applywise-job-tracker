-- CreateEnum
CREATE TYPE "AssessmentStatus" AS ENUM ('GENERATING', 'IN_PROGRESS', 'COMPLETED');

-- CreateEnum
CREATE TYPE "QuestionDifficulty" AS ENUM ('JUNIOR', 'MID', 'SENIOR');

-- CreateEnum
CREATE TYPE "ProficiencyLevel" AS ENUM ('BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT');

-- CreateTable
CREATE TABLE "SkillAssessment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "skill" TEXT NOT NULL,
    "status" "AssessmentStatus" NOT NULL DEFAULT 'GENERATING',
    "questionCount" INTEGER NOT NULL DEFAULT 0,
    "correctCount" INTEGER,
    "scorePct" INTEGER,
    "level" "ProficiencyLevel",
    "summary" TEXT,
    "strengths" TEXT[],
    "focusAreas" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SkillAssessment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AssessmentQuestion" (
    "id" TEXT NOT NULL,
    "assessmentId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "difficulty" "QuestionDifficulty" NOT NULL DEFAULT 'MID',
    "subtopic" TEXT,
    "scenario" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL,
    "selectedIndex" INTEGER,
    "isCorrect" BOOLEAN,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AssessmentQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SkillAssessment_userId_idx" ON "SkillAssessment"("userId");

-- CreateIndex
CREATE INDEX "SkillAssessment_userId_skill_idx" ON "SkillAssessment"("userId", "skill");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_assessmentId_idx" ON "AssessmentQuestion"("assessmentId");

-- CreateIndex
CREATE INDEX "AssessmentQuestion_userId_idx" ON "AssessmentQuestion"("userId");

-- AddForeignKey
ALTER TABLE "AssessmentQuestion" ADD CONSTRAINT "AssessmentQuestion_assessmentId_fkey" FOREIGN KEY ("assessmentId") REFERENCES "SkillAssessment"("id") ON DELETE CASCADE ON UPDATE CASCADE;
