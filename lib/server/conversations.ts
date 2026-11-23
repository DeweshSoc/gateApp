import { connectToDatabase } from "@/lib/db/client";
import { Conversation, Message } from "@/lib/db/models";
import { toConversationDTO, toMessageDTO } from "@/lib/serialize";
import type { ConversationDTO, MessageDTO } from "@/types";

/**
 * Load a conversation and its messages server-side for initial page render.
 * Returns null if the conversation does not exist or the DB is unavailable.
 */
export async function loadConversation(
  id: string,
): Promise<{ conversation: ConversationDTO; messages: MessageDTO[] } | null> {
  try {
    await connectToDatabase();
    const conversation = await Conversation.findById(id).lean();
    if (!conversation) return null;

    const messages = await Message.find({ conversationId: id })
      .sort({ createdAt: 1 })
      .lean();

    return {
      conversation: toConversationDTO(conversation),
      messages: messages.map(toMessageDTO),
    };
  } catch {
    return null;
  }
}
