CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'CONTACTED', 'QUALIFIED', 'PROPOSAL_SENT', 'WON', 'LOST');
CREATE TABLE "Lead" (
  "id" TEXT NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "company" VARCHAR(160),
  "phone" VARCHAR(40),
  "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
  "nextFollowUpAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMPTZ(3) NOT NULL,
  CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);
CREATE TABLE "Discussion" (
  "id" TEXT NOT NULL,
  "leadId" TEXT NOT NULL,
  "content" VARCHAR(5000) NOT NULL,
  "followUpAt" TIMESTAMPTZ(3),
  "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "Discussion_pkey" PRIMARY KEY ("id")
);
CREATE INDEX "Lead_status_idx" ON "Lead"("status");
CREATE INDEX "Lead_nextFollowUpAt_idx" ON "Lead"("nextFollowUpAt");
CREATE INDEX "Discussion_leadId_createdAt_idx" ON "Discussion"("leadId", "createdAt" DESC);
ALTER TABLE "Discussion" ADD CONSTRAINT "Discussion_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "Lead"("id") ON DELETE CASCADE ON UPDATE CASCADE;
