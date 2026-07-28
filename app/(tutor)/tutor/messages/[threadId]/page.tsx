import { ChatThreadView } from "@/components/messages/chat-thread-view";
import { getMessageThreadForMe } from "@/server/actions/messages";
import { getCurrentProfile } from "@/server/services/profile";
import { redirect } from "next/navigation";

type Props = { params: Promise<{ threadId: string }> };

export async function generateMetadata({ params }: Props) {
  const { threadId } = await params;
  return { title: `Message · ${threadId.slice(0, 6)}` };
}

export default async function TutorMessageThreadPage({ params }: Props) {
  const profile = await getCurrentProfile();
  if (!profile) redirect("/sign-in?next=/tutor/messages");
  if (profile.role !== "tutor") redirect("/tutor");

  const { threadId } = await params;
  const { thread, currentUserId, safetyCopy, error } =
    await getMessageThreadForMe(threadId);

  if (error || !thread || !currentUserId) {
    redirect("/tutor/messages");
  }

  return (
    <ChatThreadView
      threadId={thread.id}
      currentUserId={currentUserId}
      safetyCopy={safetyCopy}
      title={
        thread.learner_name
          ? `Chat · ${thread.learner_name}`
          : "Conversation"
      }
      subtitle={thread.counterpart_label}
      backHref="/tutor/messages"
    />
  );
}
