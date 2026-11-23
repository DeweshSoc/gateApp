import { ChatView } from "@/components/chat/chat-view";
import { loadSubjectsWithTopics } from "@/lib/server/subjects";
import { loadProfiles } from "@/lib/server/profiles";

export const metadata = { title: "Chat" };
export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const [subjects, profiles] = await Promise.all([loadSubjectsWithTopics(), loadProfiles()]);
  return <ChatView conversation={null} initialMessages={[]} subjects={subjects} profiles={profiles} />;
}
