-- CreateTable
CREATE TABLE "options" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL
);

-- CreateTable
CREATE TABLE "tags" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "content" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "lastModifiedBy" TEXT NOT NULL,
    "uses" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastUsedAt" DATETIME
);

-- CreateTable
CREATE TABLE "tag_aliases" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "tagId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "tag_aliases_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "tags" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "user_bot_messages" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "channelId" TEXT NOT NULL,
    "expiresAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "options_key_key" ON "options"("key");

-- CreateIndex
CREATE INDEX "tags_description_idx" ON "tags"("description");

-- CreateIndex
CREATE INDEX "tags_uses_idx" ON "tags"("uses");

-- CreateIndex
CREATE INDEX "tags_lastUsedAt_idx" ON "tags"("lastUsedAt");

-- CreateIndex
CREATE INDEX "tags_createdAt_idx" ON "tags"("createdAt");

-- CreateIndex
CREATE UNIQUE INDEX "tag_aliases_name_key" ON "tag_aliases"("name");

-- CreateIndex
CREATE INDEX "tag_aliases_tagId_idx" ON "tag_aliases"("tagId");

-- CreateIndex
CREATE INDEX "user_bot_messages_expiresAt_idx" ON "user_bot_messages"("expiresAt");

-- CreateIndex
CREATE INDEX "user_bot_messages_userId_channelId_idx" ON "user_bot_messages"("userId", "channelId");
