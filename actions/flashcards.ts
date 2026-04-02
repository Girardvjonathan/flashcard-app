"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface FlashcardInput {
  question: string;
  answer: string;
  context: string;
  tags: string[];
}

async function getSession() {
  const session = await auth();
  if (!session?.user?.id) throw new Error("Unauthorized");
  return session.user.id;
}

async function upsertTags(userId: string, tagNames: string[]) {
  return Promise.all(
    tagNames.map((name) =>
      db.tag.upsert({
        where: { name_userId: { name, userId } },
        create: { name, userId },
        update: {},
      })
    )
  );
}

export async function createFlashcard(input: FlashcardInput) {
  const userId = await getSession();

  const question = input.question.trim();
  const answer = input.answer.trim();

  if (!question) throw new Error("Question is required");
  if (!answer) throw new Error("Answer is required");

  const tags = await upsertTags(userId, input.tags);

  const flashcard = await db.flashcard.create({
    data: {
      question,
      answer,
      context: input.context?.trim() || null,
      userId,
      flashcardTags: {
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
    },
  });

  revalidatePath("/flashcards");
  return flashcard;
}

export async function updateFlashcard(id: string, input: FlashcardInput) {
  const userId = await getSession();

  const existing = await db.flashcard.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");

  const question = input.question.trim();
  const answer = input.answer.trim();

  if (!question) throw new Error("Question is required");
  if (!answer) throw new Error("Answer is required");

  const tags = await upsertTags(userId, input.tags);

  await db.flashcardTag.deleteMany({ where: { flashcardId: id } });
  await db.flashcardTag.createMany({
    data: tags.map((tag) => ({ flashcardId: id, tagId: tag.id })),
  });

  const flashcard = await db.flashcard.update({
    where: { id },
    data: {
      question,
      answer,
      context: input.context?.trim() || null,
    },
  });

  revalidatePath("/flashcards");
  revalidatePath(`/flashcards/${id}/edit`);
  return flashcard;
}

export async function deleteFlashcard(id: string) {
  const userId = await getSession();

  const existing = await db.flashcard.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");

  await db.flashcard.delete({ where: { id } });
  revalidatePath("/flashcards");
}
