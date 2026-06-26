export type Pillar =
  | "gym_motivation" // gym motivation & culture
  | "nutrition" // nutrition, protein & meals
  | "identity" // identity, Stoic philosophy & anime
  | "london" // London fitness scene
  | "brand"; // Alpha District brand post

export type PostStatus =
  | "pending_review" // generated, awaiting Telegram approval
  | "ready" // approved, queued to publish
  | "publishing" // publish in progress (guards against double-posting)
  | "rejected" // declined in review
  | "posted" // live on Instagram
  | "failed"; // publish error

export interface Post {
  id: string;
  pillar: Pillar;
  caption: string;
  hook?: string;
  hashtags: string[];
  imagePrompt: string;
  imagePath?: string; // path within the Storage bucket
  imageUrl?: string; // signed public URL handed to the Graph API
  status: PostStatus;
  scheduledFor: number; // epoch ms — when it should publish
  createdAt: number;
  updatedAt: number;
  telegramMessageId?: number;
  igContainerId?: string;
  igMediaId?: string;
  error?: string;
}

export interface GeneratedCaption {
  caption: string;
  hashtags: string[];
  imagePrompt: string;
  hook: string; // short scroll-stopper (≤6 words) for the on-image overlay
}
