import { CONFIG } from "./config";
import { generateCaption } from "./lib/claude";
import { getImageProvider } from "./lib/image";
import { uploadImage } from "./lib/storage";
import { createPost, updatePost } from "./lib/firestore";
import { pickPillar } from "./pillars";
import { Post } from "./types";

// One full generation cycle: pick a pillar, write the caption, generate the
// image, upload it, and queue the post for review.
// NOTE: for the "stoic" pillar the image is a background only — overlaying the
// quote in Anton happens in a compositing step (TODO Phase 3 enhancement).
export async function generatePost(keys: {
  anthropic: string;
  openai: string;
}): Promise<Post> {
  const pillar = pickPillar();

  const { caption, hashtags, imagePrompt } = await generateCaption(
    pillar,
    keys.anthropic
  );

  // Create the doc first so the image filename can use the post id.
  const post = await createPost({
    pillar,
    caption,
    hashtags,
    imagePrompt,
    status: "pending_review",
    scheduledFor: Date.now() + CONFIG.publishLeadHours * 60 * 60 * 1000,
  });

  const provider = getImageProvider(keys.openai);
  const bytes = await provider.generate(imagePrompt);
  const { path, url } = await uploadImage(bytes, post.id);

  await updatePost(post.id, { imagePath: path, imageUrl: url });

  return { ...post, imagePath: path, imageUrl: url };
}
