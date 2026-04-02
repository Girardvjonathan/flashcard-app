"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function getOwnedAnswer(answerId: string, userId: string) {
  const answer = await db.studyAnswer.findFirst({
    where: { id: answerId, session: { userId } },
  });
  if (!answer) throw new Error("Not found");
  return answer;
}

/** Fisher-Yates shuffle (in-place, returns array) */
function shuffle<T>(arr: T[]): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export async function startStudySession(collectionId: string): Promise<string> {
  const userId = await getSession();

  const collection = await db.collection.findFirst({
    where: { id: collectionId, userId },
    include: { collectionTags: { include: { tag: true } } },
  });
  if (!collection) throw new Error("Not found");

  const tagNames = collection.collectionTags.map((ct) => ct.tag.name);

  const flashcards = await db.flashcard.findMany({
    where:
      tagNames.length === 0
        ? { id: "none" } // empty collection guard
        : { userId, flashcardTags: { some: { tag: { name: { in: tagNames } } } } },
    select: { id: true },
  });

  if (flashcards.length === 0) throw new Error("No flashcards match this collection");

  const shuffled = shuffle(flashcards.map((f) => f.id));

  const session = await db.studySession.create({
    data: {
      userId,
      collectionId,
      studyAnswers: {
        create: shuffled.map((flashcardId, order) => ({
          flashcardId,
          answer: "",
          order,
        })),
      },
    },
  });

  return session.id;
}

export async function submitAnswer(answerId: string, answer: string): Promise<void> {
  const userId = await getSession();
  await getOwnedAnswer(answerId, userId);

  await db.studyAnswer.update({
    where: { id: answerId },
    data: { answer },
  });
}

export async function markAnswer(answerId: string, correct: boolean): Promise<void> {
  const userId = await getSession();
  await getOwnedAnswer(answerId, userId);

  await db.studyAnswer.update({
    where: { id: answerId },
    data: { correct },
  });
}

export async function saveNote(answerId: string, note: string): Promise<void> {
  const userId = await getSession();
  await getOwnedAnswer(answerId, userId);

  await db.studyAnswer.update({
    where: { id: answerId },
    data: { note: note.trim() || null },
  });
}

export async function endStudySession(sessionId: string): Promise<void> {
  const userId = await getSession();

  const session = await db.studySession.findFirst({
    where: { id: sessionId, userId },
  });
  if (!session) throw new Error("Not found");

  await db.studySession.update({
    where: { id: sessionId },
    data: { endedAt: new Date() },
  });

  revalidatePath("/history");
}
