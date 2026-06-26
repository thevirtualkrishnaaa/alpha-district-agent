import { CONFIG } from "./config";
import { generateCaption } from "./lib/claude";
import { getImageProvider } from "./lib/image";
import { composeImage } from "./lib/compose";
import { uploadImage } from "./lib/storage";
import { createPost, updatePost } from "./lib/firestore";
import { pickPillar, pickVariety, PILLARS } from "./pillars";
import { Post } from "./types";

// One full generation cycle: pick a pillar, write the caption (+ hook), generate
// a varied image, composite the hook/badge onto it, upload, and queue for review.
export async function generatePost(keys: {
  anthropic: string;
  openai: string;
}): Promise<Post> {
  const pillar = pickPillar();
  const spec = PILLARS[pillar];

  const gen = await generateCaption(pillar, keys.anthropic);

  // Create the doc first so the image filename can use the post id.
  const post = await createPost({
    pillar,
    caption: gen.caption,
    hook: gen.hook,
    hashtags: gen.hashtags,
    imagePrompt: gen.imagePrompt,
    status: "pending_review",
    scheduledFor: Date.now() + CONFIG.publishLeadHours * 60 * 60 * 1000,
  });

  const provider = getImageProvider(keys.openai);
  // Append a rotating cinematic modifier so visuals don't look samey.
  const rawImage = await provider.generate(`${gen.imagePrompt} ${pickVariety()}`);
  const finalImage = await composeImage(rawImage, {
    hook: gen.hook,
    overlayHook: !!spec.hookOverlay,
  });
  const { path, url } = await uploadImage(finalImage, post.id);

  await updatePost(post.id, { imagePath: path, imageUrl: url });

  return { ...post, imagePath: path, imageUrl: url };
}
