import { json, error } from "@sveltejs/kit";
import { onlyAdmin } from "$lib/server/auth-utils";
import { postService } from "$lib/server/services/post.service";
import type { RequestHandler } from "./$types";

export const DELETE: RequestHandler = onlyAdmin(async ({ params }) => {
  const postId = parseInt(params.id);
  if (isNaN(postId)) {
    throw error(400, "Invalid post ID");
  }

  try {
    await postService.delete(postId);
    return json({ success: true });
  } catch (err) {
    console.error("Delete post error:", err);
    throw error(500, "Failed to delete post");
  }
});
