"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";

interface CollectionInput {
  name: string;
  description: string;
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

export async function createCollection(input: CollectionInput) {
  const userId = await getSession();

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  const tags = await upsertTags(userId, input.tags);

  const collection = await db.collection.create({
    data: {
      name,
      description: input.description?.trim() || null,
      userId,
      collectionTags: {
        create: tags.map((tag) => ({ tagId: tag.id })),
      },
    },
  });

  revalidatePath("/collections");
  return collection;
}

export async function updateCollection(id: string, input: CollectionInput) {
  const userId = await getSession();

  const existing = await db.collection.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");

  const name = input.name.trim();
  if (!name) throw new Error("Name is required");

  const tags = await upsertTags(userId, input.tags);

  await db.collectionTag.deleteMany({ where: { collectionId: id } });
  await db.collectionTag.createMany({
    data: tags.map((tag) => ({ collectionId: id, tagId: tag.id })),
  });

  const collection = await db.collection.update({
    where: { id },
    data: {
      name,
      description: input.description?.trim() || null,
    },
  });

  revalidatePath("/collections");
  revalidatePath(`/collections/${id}`);
  revalidatePath(`/collections/${id}/edit`);
  return collection;
}

export async function deleteCollection(id: string) {
  const userId = await getSession();

  const existing = await db.collection.findFirst({ where: { id, userId } });
  if (!existing) throw new Error("Not found");

  await db.collection.delete({ where: { id } });
  revalidatePath("/collections");
}
