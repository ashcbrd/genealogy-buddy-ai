-- Migration: Replace FAMILY_TREE with TRANSLATION in AnalysisType enum
-- Run this in Supabase SQL Editor when database is accessible

-- Step 1: Add TRANSLATION to the enum
ALTER TYPE "AnalysisType" ADD VALUE 'TRANSLATION';

-- Step 2: Update existing FAMILY_TREE records to TRANSLATION (if any exist)
-- This preserves existing data by converting it to the new type
UPDATE "Analysis" SET "type" = 'TRANSLATION' WHERE "type" = 'FAMILY_TREE';
UPDATE "Usage" SET "type" = 'TRANSLATION' WHERE "type" = 'FAMILY_TREE';

-- Step 3: Remove FAMILY_TREE from the enum (PostgreSQL doesn't support removing enum values directly)
-- We'll create a new enum and update the columns to use it

-- Create new enum without FAMILY_TREE
CREATE TYPE "AnalysisType_new" AS ENUM ('DOCUMENT', 'DNA', 'TRANSLATION', 'RESEARCH', 'PHOTO');

-- Update Analysis table to use new enum
ALTER TABLE "Analysis" ALTER COLUMN "type" TYPE "AnalysisType_new" USING ("type"::text::"AnalysisType_new");

-- Update Usage table to use new enum  
ALTER TABLE "Usage" ALTER COLUMN "type" TYPE "AnalysisType_new" USING ("type"::text::"AnalysisType_new");

-- Drop old enum and rename new one
DROP TYPE "AnalysisType";
ALTER TYPE "AnalysisType_new" RENAME TO "AnalysisType";

-- Verify the changes
SELECT UNNEST(enum_range(NULL::"AnalysisType")) AS analysis_types;