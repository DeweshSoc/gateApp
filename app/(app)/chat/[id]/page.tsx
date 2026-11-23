import { notFound } from "next/navigation";
import { ChatView } from "@/components/chat/chat-view";
import { loadConversation } from "@/lib/server/conversations";
import { loadSubjectsWithTopics } from "@/lib/server/subjects";
import { loadProfiles } from "@/lib/server/profiles";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = await loadConversation(id);
  return { title: data?.conversation.title ?? "Chat" };
}

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const [data, subjects, profiles] = await Promise.all([
    loadConversation(id),
    loadSubjectsWithTopics(),
    loadProfiles(),
  ]);
  if (!data) notFound();

  return (
    <ChatView
      conversation={data.conversation}
      initialMessages={data.messages}
      subjects={subjects}
      profiles={profiles}
    />
  );
}
