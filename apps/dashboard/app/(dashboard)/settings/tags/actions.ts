"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getAuthOrRedirect } from "@/lib/auth";
import { createTag, deleteTag } from "@/lib/queries/tags";

const TagSchema = z.object({
  name: z.string().min(1).max(50),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/),
});

export async function createTagAction(data: unknown) {
  const { internalOrgId } = await getAuthOrRedirect();
  const { name, color } = TagSchema.parse(data);
  await createTag(internalOrgId, name, color);
  revalidatePath("/settings/tags");
}

export async function deleteTagAction(tagId: string) {
  const { internalOrgId } = await getAuthOrRedirect();
  await deleteTag(tagId, internalOrgId);
  revalidatePath("/settings/tags");
}
