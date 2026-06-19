export type PostStatus = "pending" | "approved" | "adjustments";
export type CommentAuthor = "agency" | "client";

export interface AnnotationPin {
  id: string;
  xPercent: number;
  yPercent: number;
  text: string;
  author: CommentAuthor;
  authorName?: string | null;
  resolved: boolean;
  createdAt: string;
  attachmentSlideId?: string | null;
}

export interface AttachmentSlide {
  id: string;
  order: number;
  url: string;
  mediaType?: string;
  label?: string | null;
  pins?: AnnotationPin[];
}

export interface AttachmentVersion {
  id: string;
  url: string;
  version: number;
  createdAt: string;
  slides?: AttachmentSlide[];
  pins: AnnotationPin[];
}

export interface PostAttachment {
  id: string;
  type: string;
  label: string | null;
  order: number;
  versions: AttachmentVersion[];
}

export interface Comment {
  id: string;
  author: CommentAuthor;
  authorName?: string | null;
  text: string;
  createdAt: string;
}

export interface Post {
  id: string;
  scheduledAt: string;
  channel: string;
  copyText: string;
  status: PostStatus;
  comments: Comment[];
  attachments: PostAttachment[];
}
