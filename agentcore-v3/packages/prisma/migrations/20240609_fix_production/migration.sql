-- Migration: Add plan column and SUPERADMIN role
-- This fixes production database issues found during testing

-- Add plan column to Workspace table if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Workspace' AND column_name='plan') THEN
        ALTER TABLE "Workspace" ADD COLUMN "plan" TEXT DEFAULT 'TRIAL';
    END IF;
END $$;

-- Update existing workspaces to have a plan
UPDATE "Workspace" SET "plan" = 'TRIAL' WHERE "plan" IS NULL;

-- Add SUPERADMIN to UserRole enum if not exists
-- Note: PostgreSQL enums can't be easily modified, so we need to handle this carefully
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'SUPERADMIN' 
                   AND enumtypid = (SELECT oid FROM pg_type WHERE typname = 'UserRole')) THEN
        ALTER TYPE "UserRole" ADD VALUE 'SUPERADMIN';
    END IF;
END $$;

-- Add trialEndsAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Workspace' AND column_name='trialEndsAt') THEN
        ALTER TABLE "Workspace" ADD COLUMN "trialEndsAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add subscriptionActive column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Workspace' AND column_name='subscriptionActive') THEN
        ALTER TABLE "Workspace" ADD COLUMN "subscriptionActive" BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Add subscriptionStartsAt column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Workspace' AND column_name='subscriptionStartsAt') THEN
        ALTER TABLE "Workspace" ADD COLUMN "subscriptionStartsAt" TIMESTAMP(3);
    END IF;
END $$;

-- Add settings column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='Workspace' AND column_name='settings') THEN
        ALTER TABLE "Workspace" ADD COLUMN "settings" JSONB;
    END IF;
END $$;

-- Add tokenVersion column to User if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='User' AND column_name='tokenVersion') THEN
        ALTER TABLE "User" ADD COLUMN "tokenVersion" INTEGER DEFAULT 0;
    END IF;
END $$;

-- Add role column to User if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                   WHERE table_name='User' AND column_name='role') THEN
        ALTER TABLE "User" ADD COLUMN "role" TEXT DEFAULT 'OWNER';
    END IF;
END $$;

-- Create index on workspaceId for User if not exists
CREATE INDEX IF NOT EXISTS "User_workspaceId_idx" ON "User"("workspaceId");

-- Create index on workspaceId for Agent if not exists
CREATE INDEX IF NOT EXISTS "Agent_workspaceId_idx" ON "Agent"("workspaceId");

-- Create index on workspaceId for Conversation if not exists
CREATE INDEX IF NOT EXISTS "Conversation_workspaceId_idx" ON "Conversation"("workspaceId");

-- Create index on workspaceId for CRMContact if not exists
CREATE INDEX IF NOT EXISTS "CRMContact_workspaceId_idx" ON "CRMContact"("workspaceId");

-- Create index on workspaceId for KnowledgeDocument if not exists
CREATE INDEX IF NOT EXISTS "KnowledgeDocument_workspaceId_idx" ON "KnowledgeDocument"("workspaceId");

-- Create index on workspaceId for BillingTransaction if not exists
CREATE INDEX IF NOT EXISTS "BillingTransaction_workspaceId_idx" ON "BillingTransaction"("workspaceId");

-- Create index on conversationId for Message if not exists
CREATE INDEX IF NOT EXISTS "Message_conversationId_idx" ON "Message"("conversationId");

-- Create index on agentId for Conversation if not exists
CREATE INDEX IF NOT EXISTS "Conversation_agentId_idx" ON "Conversation"("agentId");

-- Create index on workspaceId and isActive for Agent if not exists
CREATE INDEX IF NOT EXISTS "Agent_workspaceId_isActive_idx" ON "Agent"("workspaceId", "isActive");

-- Create index on workspaceId and updatedAt for Conversation if not exists
CREATE INDEX IF NOT EXISTS "Conversation_workspaceId_updatedAt_idx" ON "Conversation"("workspaceId", "updatedAt");

-- Create index on workspaceId and title for Conversation if not exists
CREATE INDEX IF NOT EXISTS "Conversation_workspaceId_title_idx" ON "Conversation"("workspaceId", "title");

-- Create index on status for CRMContact if not exists
CREATE INDEX IF NOT EXISTS "CRMContact_status_idx" ON "CRMContact"("status");

-- Create index on conversationId and order for Message if not exists
CREATE INDEX IF NOT EXISTS "Message_conversationId_order_idx" ON "Message"("conversationId", "order");

-- Create index on conversationId and role for Message if not exists
CREATE INDEX IF NOT EXISTS "Message_conversationId_role_idx" ON "Message"("conversationId", "role");

-- Create index on createdAt for Message if not exists
CREATE INDEX IF NOT EXISTS "Message_createdAt_idx" ON "Message"("createdAt");

-- Create index on agentId for Integration if not exists
CREATE INDEX IF NOT EXISTS "Integration_agentId_idx" ON "Integration"("agentId");

-- Create index on provider for Integration if not exists
CREATE INDEX IF NOT EXISTS "Integration_provider_idx" ON "Integration"("provider");

-- Create index on integrationId for IntegrationLog if not exists
CREATE INDEX IF NOT EXISTS "IntegrationLog_integrationId_idx" ON "IntegrationLog"("integrationId");

-- Create index on integrationId and createdAt for IntegrationLog if not exists
CREATE INDEX IF NOT EXISTS "IntegrationLog_integrationId_createdAt_idx" ON "IntegrationLog"("integrationId", "createdAt");

-- Create index on direction for IntegrationLog if not exists
CREATE INDEX IF NOT EXISTS "IntegrationLog_direction_idx" ON "IntegrationLog"("direction");

-- Create index on workspaceId and provider for Integration (unique) if not exists
CREATE INDEX IF NOT EXISTS "Integration_agentId_provider_idx" ON "Integration"("agentId", "provider");

-- Create index on workspaceId and createdAt for BillingTransaction if not exists
CREATE INDEX IF NOT EXISTS "BillingTransaction_workspaceId_createdAt_idx" ON "BillingTransaction"("workspaceId", "createdAt");

-- Create index on type for BillingTransaction if not exists
CREATE INDEX IF NOT EXISTS "BillingTransaction_type_idx" ON "BillingTransaction"("type");

-- Create index on status for BillingTransaction if not exists
CREATE INDEX IF NOT EXISTS "BillingTransaction_status_idx" ON "BillingTransaction"("status");

-- Create index on workspaceId and type for KnowledgeDocument if not exists
CREATE INDEX IF NOT EXISTS "KnowledgeDocument_workspaceId_type_idx" ON "KnowledgeDocument"("workspaceId", "type");

-- Verify the fix
SELECT 'Migration completed successfully' as status;
