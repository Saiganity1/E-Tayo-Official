/**
 * Utility to dispatch and synchronize automated permit notifications and messages
 * between municipal staff/evaluators and applicants.
 */

export interface SystemPermitMessage {
  id: string;
  senderEmail: string;
  recipientEmail: string;
  content: string;
  applicationId: string;
  timestamp: string;
}

export const dispatchPermitMessage = async ({
  applicationId,
  recipientEmail,
  senderEmail = "staff@etayo.gov.ph",
  content,
}: {
  applicationId: string;
  recipientEmail: string;
  senderEmail?: string;
  content: string;
}): Promise<SystemPermitMessage> => {
  const newMsg: SystemPermitMessage = {
    id: `msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    senderEmail,
    recipientEmail,
    content,
    applicationId,
    timestamp: new Date().toISOString()
  };

  // 1. Persist locally to localStorage so it is always present offline / in browser
  try {
    const raw = localStorage.getItem("etayo_messages_history");
    const currentList: SystemPermitMessage[] = raw ? JSON.parse(raw) : [];
    const updatedList = [...currentList, newMsg];
    localStorage.setItem("etayo_messages_history", JSON.stringify(updatedList));

    // Also register user thread if not present
    const userThreadsKey = `etayo_threads_${recipientEmail}`;
    const rawThreads = localStorage.getItem(userThreadsKey);
    const threads: string[] = rawThreads ? JSON.parse(rawThreads) : [];
    if (!threads.includes(applicationId)) {
      localStorage.setItem(userThreadsKey, JSON.stringify([...threads, applicationId]));
    }
  } catch (e) {
    console.warn("Could not cache message to localStorage", e);
  }

  // 2. Dispatch custom event for real-time reactive UI update in open windows
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("etayo_new_message", { detail: newMsg }));
  }

  // 3. Attempt POST to backend /api/messages/send
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
    await fetch(`${apiUrl}/api/messages/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newMsg)
    });
  } catch (e) {
    // Non-blocking: will fall back to local storage cache
  }

  return newMsg;
};

export const getCachedMessages = (userEmail?: string, appId?: string): SystemPermitMessage[] => {
  try {
    const raw = localStorage.getItem("etayo_messages_history");
    if (!raw) return [];
    const list: SystemPermitMessage[] = JSON.parse(raw);
    return list.filter(m => {
      const matchApp = !appId || m.applicationId === appId || m.content.includes(appId);
      const matchUser = !userEmail || m.recipientEmail === userEmail || m.senderEmail === userEmail;
      return matchApp && matchUser;
    });
  } catch (e) {
    return [];
  }
};
