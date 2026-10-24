-- Legacy accounts have no inferred or backdated acceptance.
ALTER TABLE "User" ADD COLUMN "termsAcceptedAt" TIMESTAMP(3),
  ADD COLUMN "dataConsentAt" TIMESTAMP(3), ADD COLUMN "legalVersion" TEXT;
