import { Sender } from "../generated/client/enums";
import type { MessageModel } from "../generated/client/models/Message";
import { prisma } from "../db/prisma";
import { ConversationNotFoundError } from "../utils/error";

export async function createConversation() {
  return prisma.conversation.create({
    data: {
      channel: "web", // optional, future-ready
    },
  });
}

async function requireConversation(conversationId: string) {
  const conversation = await prisma.conversation.findUnique({
    where: { id: conversationId },
  });

  if (!conversation) {
    throw new ConversationNotFoundError(conversationId);
  }

  return conversation;
}

export async function saveUserMessage(
  conversationId: string,
  content: string
) {
  await requireConversation(conversationId);
  
  return prisma.message.create({
    data: {
      conversationId,
      sender: Sender.user,
      content,
    },
  });
}

export async function saveAIMessage(
  conversationId: string,
  content: string
) {
  await requireConversation(conversationId);

  return prisma.message.create({
    data: {
      conversationId,
      sender: Sender.ai,
      content,
    },
  });
}

export async function getConversationMessages(
  conversationId: string,
  limit?: number
): Promise<MessageModel[]> {
  await requireConversation(conversationId);

  const recentMessages = await prisma.message.findMany({
    where: { conversationId },
    orderBy: { createdAt: "desc" },
    ...(typeof limit === "number" ? { take: limit } : {}),
  });

  return recentMessages.reverse();
}


