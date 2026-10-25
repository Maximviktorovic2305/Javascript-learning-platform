-- Preserve the saved timezones of existing accounts. New accounts follow the device.
ALTER TABLE "User" ADD COLUMN "timezoneAuto" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "User" ALTER COLUMN "timezoneAuto" SET DEFAULT true;
