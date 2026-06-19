"use client";

import { useCallback, useEffect, useState, useRef } from "react";
import { useParams, useSearchParams, useRouter } from "next/navigation";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Keyboard } from "swiper/modules";
import type { Swiper as SwiperType } from "swiper";
import { Calendar, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { PostSlide, type Post, type PostStatus } from "@/components/post-slide";
import { PostSlideEditable } from "@/components/post-slide-editable";
import { CalendarModal } from "@/components/calendar-modal";
import { Header } from "@/components/header";
import { PostHandoffDialog } from "@/components/post-handoff-dialog";

import "swiper/css";
import "swiper/css/navigation";

export default function CalendarPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("t");

  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [currentPostIndex, setCurrentPostIndex] = useState(0);
  const [clientName, setClientName] = useState("");
  const [isAdmin, setIsAdmin] = useState(false);
  const [reviewerName, setReviewerName] = useState<string | null>(null);
  const [permissions, setPermissions] = useState({
    canComment: true,
    canPin: true,
    canApprove: true,
  });
  const [teamMembers, setTeamMembers] = useState<
    Array<{ user: { id: string; name: string | null; email: string } }>
  >([]);
  const [handoffPost, setHandoffPost] = useState<Post | null>(null);
  const swiperRef = useRef<SwiperType | null>(null);

  const fetchPosts = useCallback(async () => {
    const url = token
      ? `/api/calendar/${params.clientSlug}/${params.versionId}/posts?t=${token}`
      : `/api/calendar/${params.clientSlug}/${params.versionId}/posts`;

    const response = await fetch(url);

    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || "Erro ao carregar posts");
    }

    const data = await response.json();
    setPosts(data.posts);

    if (data.isAdmin) {
      setIsAdmin(true);
    }

    if (data.access?.reviewer) {
      setReviewerName(data.access.reviewer.name);
    }
    if (data.access?.permissions) {
      setPermissions(data.access.permissions);
    }

    setClientName(
      String(params.clientSlug)
        .split("-")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ")
    );

    if (data.posts.length > 0) {
      setCurrentMonth(new Date(data.posts[0].scheduledAt));
    }
  }, [token, params.clientSlug, params.versionId]);

  useEffect(() => {
    async function init() {
      try {
        const adminRes = await fetch("/api/check-admin");
        const adminData = await adminRes.json();
        setIsAdmin(adminData.isAdmin);

        if (!token && !adminData.isAdmin) {
          setError("Token não fornecido. Acesse com ?t=TOKEN");
          setLoading(false);
          return;
        }

        if (adminData.isAdmin) {
          try {
            const teamRes = await fetch("/api/team");
            if (teamRes.ok) {
              const teamData = await teamRes.json();
              setTeamMembers(teamData.members ?? []);
            }
          } catch {
            // team list is optional for delegation
          }
        }

        await fetchPosts();
      } catch (err) {
        setError(err instanceof Error ? err.message : "Erro desconhecido");
      } finally {
        setLoading(false);
      }
    }

    init();
  }, [token, fetchPosts]);

  const handleStatusChange = async (postId: string, status: PostStatus) => {
    try {
      const response = await fetch(`/api/posts/${postId}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status, token }),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar status");
      }

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, status } : post
        )
      );
    } catch (err) {
      console.error("Error updating status:", err);
    }
  };

  const handleCommentAdd = async (postId: string, text: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, token }),
      });

      if (!response.ok) {
        throw new Error("Erro ao adicionar comentário");
      }

      const data = await response.json();

      console.log("Comentário criado:", data.comment);

      // Update local state
      setPosts((prev) => {
        const updated = prev.map((post) =>
          post.id === postId
            ? { ...post, comments: [...post.comments, data.comment] }
            : post
        );
        console.log("Posts atualizados:", updated.find(p => p.id === postId)?.comments);
        return updated;
      });
    } catch (err) {
      console.error("Error adding comment:", err);
    }
  };

  const handleDayClick = async (postIndex: number, date?: Date) => {
    if (isAdmin && postIndex === -1 && date) {
      try {
        const response = await fetch(
          `/api/calendar/${params.clientSlug}/${params.versionId}/posts/create`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              scheduledAt: date.toISOString(),
              channel: "Instagram",
              copyText: "",
            }),
          }
        );

        if (!response.ok) {
          throw new Error("Erro ao criar post");
        }

        const data = await response.json();
        setPosts((prev) => {
          const updated = [...prev, data.post].sort((a, b) =>
            new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
          );
          setTimeout(() => {
            if (swiperRef.current) {
              const newIndex = updated.findIndex((p) => p.id === data.post.id);
              swiperRef.current.slideTo(newIndex >= 0 ? newIndex : updated.length - 1, 0);
            }
          }, 100);
          return updated;
        });
      } catch (err) {
        console.error("Error creating post:", err);
        alert("Erro ao criar post");
      }
    } else if (postIndex >= 0) {
      if (swiperRef.current) {
        swiperRef.current.slideTo(postIndex, 0);
      }
    }
  };

  const handleHandoffSuccess = () => {
    void fetchPosts();
    setHandoffPost(null);
  };

  const handlePostUpdate = async (postId: string, data: Partial<Post>) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error("Erro ao atualizar post");
      }

      const updated = await response.json();

      // Update local state
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId ? { ...post, ...updated.post } : post
        )
      );
    } catch (err) {
      console.error("Error updating post:", err);
      alert("Erro ao atualizar post");
    }
  };

  const handlePostDelete = async (postId: string) => {
    try {
      const response = await fetch(`/api/posts/${postId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Erro ao deletar post");
      }

      setPosts((prev) => prev.filter((post) => post.id !== postId));
      
      if (swiperRef.current && currentPostIndex > 0) {
        swiperRef.current.slideTo(currentPostIndex - 1, 0);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
      alert("Erro ao deletar post");
    }
  };

  const handleAddPostToDay = async (date: Date) => {
    try {
      const response = await fetch(
        `/api/calendar/${params.clientSlug}/${params.versionId}/posts/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: date.toISOString(),
            channel: "Instagram",
            copyText: "",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao criar post");
      }

      const data = await response.json();
      setPosts((prev) => {
        const updated = [...prev, data.post].sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        setTimeout(() => {
          if (swiperRef.current) {
            const newIndex = updated.findIndex((p) => p.id === data.post.id);
            swiperRef.current.slideTo(newIndex >= 0 ? newIndex : updated.length - 1, 0);
          }
        }, 100);
        return updated;
      });
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Erro ao criar post");
    }
  };

  const handlePinCreate = async (
    versionId: string,
    xPercent: number,
    yPercent: number,
    text: string,
    author: "agency" | "client",
    slideId?: string | null
  ) => {
    try {
      const response = await fetch(`/api/attachment-versions/${versionId}/pins`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ xPercent, yPercent, text, author, slideId, token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        if (response.status === 404) {
          await fetchPosts();
          alert("Os dados do post estavam desatualizados. Recarregamos — tente anotar novamente.");
          return;
        }
        throw new Error(
          typeof data.error === "string" ? data.error : "Erro ao criar anotação"
        );
      }

      const data = await response.json();
      const createdPin = {
        id: data.pin.id,
        xPercent: data.pin.xPercent,
        yPercent: data.pin.yPercent,
        text: data.pin.text,
        author: data.pin.author as "agency" | "client",
        authorName: data.pin.authorName ?? null,
        resolved: Boolean(data.pin.resolved),
        createdAt: data.pin.createdAt,
        attachmentSlideId: data.pin.attachmentSlideId ?? null,
      };

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          attachments: (post.attachments || []).map((att) => ({
            ...att,
            versions: att.versions.map((v) => {
              if (v.id !== versionId) return v;
              if (slideId && v.slides?.length) {
                return {
                  ...v,
                  slides: v.slides.map((slide) =>
                    slide.id === slideId
                      ? {
                          ...slide,
                          pins: [...(slide.pins ?? []).filter((p) => p.id !== createdPin.id), createdPin],
                        }
                      : slide
                  ),
                };
              }
              return {
                ...v,
                pins: [...(v.pins ?? []).filter((p) => p.id !== createdPin.id), createdPin],
              };
            }),
          })),
        }))
      );
    } catch (err) {
      console.error("Error creating pin:", err);
      alert(err instanceof Error ? err.message : "Erro ao criar anotação");
    }
  };

  const handlePinResolve = async (pinId: string, resolved: boolean) => {
    try {
      const response = await fetch(`/api/attachment-versions/any/pins`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pinId, resolved, token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Erro ao atualizar anotação"
        );
      }

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          attachments: (post.attachments || []).map((att) => ({
            ...att,
            versions: att.versions.map((v) => ({
              ...v,
              pins: (v.pins ?? []).map((p) => (p.id === pinId ? { ...p, resolved } : p)),
              slides: (v.slides ?? []).map((slide) => ({
                ...slide,
                pins: (slide.pins ?? []).map((p) => (p.id === pinId ? { ...p, resolved } : p)),
              })),
            })),
          })),
        }))
      );
    } catch (err) {
      console.error("Error resolving pin:", err);
      alert(err instanceof Error ? err.message : "Erro ao atualizar anotação");
    }
  };

  const handlePinDelete = async (pinId: string) => {
    try {
      const response = await fetch(`/api/attachment-versions/any/pins`, {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ pinId, token }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(
          typeof data.error === "string" ? data.error : "Erro ao excluir anotação"
        );
      }

      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          attachments: (post.attachments || []).map((att) => ({
            ...att,
            versions: att.versions.map((v) => ({
              ...v,
              pins: (v.pins ?? []).filter((p) => p.id !== pinId),
              slides: (v.slides ?? []).map((slide) => ({
                ...slide,
                pins: (slide.pins ?? []).filter((p) => p.id !== pinId),
              })),
            })),
          })),
        }))
      );
    } catch (err) {
      console.error("Error deleting pin:", err);
      alert(err instanceof Error ? err.message : "Erro ao excluir anotação");
    }
  };

  const handleAttachmentAdd = async (
    postId: string,
    type: string,
    label: string | null,
    url: string,
    slides?: Array<{ url: string; mediaType: "image" | "video" }>
  ) => {
    try {
      const response = await fetch(`/api/posts/${postId}/attachments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, label, url, slides }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar material");

      const data = await response.json();
      setPosts((prev) =>
        prev.map((post) =>
          post.id === postId
            ? { ...post, attachments: [...(post.attachments || []), data.attachment] }
            : post
        )
      );
    } catch (err) {
      console.error("Error adding attachment:", err);
      alert("Erro ao adicionar material");
    }
  };

  const handleAttachmentVersionAdd = async (
    attachmentId: string,
    url: string,
    slides?: Array<{ url: string; mediaType: "image" | "video" }>
  ) => {
    try {
      const response = await fetch(`/api/attachments/${attachmentId}/versions`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, slides }),
      });

      if (!response.ok) throw new Error("Erro ao adicionar versão");

      const data = await response.json();
      setPosts((prev) =>
        prev.map((post) => ({
          ...post,
          attachments: (post.attachments || []).map((att) =>
            att.id === attachmentId
              ? { ...att, versions: [...att.versions, data.version] }
              : att
          ),
        }))
      );
    } catch (err) {
      console.error("Error adding version:", err);
      alert("Erro ao adicionar versão");
    }
  };

  const handleAttachmentVersionUpdate = (
    attachmentId: string,
    version: (typeof posts)[number]["attachments"][number]["versions"][number]
  ) => {
    setPosts((prev) =>
      prev.map((post) => ({
        ...post,
        attachments: (post.attachments || []).map((att) =>
          att.id === attachmentId
            ? {
                ...att,
                versions: att.versions.map((v) => (v.id === version.id ? version : v)),
              }
            : att
        ),
      }))
    );
  };

  const handleAddPost = async () => {
    try {
      const response = await fetch(
        `/api/calendar/${params.clientSlug}/${params.versionId}/posts/create`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            scheduledAt: new Date().toISOString(),
            channel: "Instagram",
            copyText: "Novo post",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Erro ao criar post");
      }

      const data = await response.json();
      setPosts((prev) => {
        const updated = [...prev, data.post].sort((a, b) =>
          new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()
        );
        setTimeout(() => {
          if (swiperRef.current) {
            const newIndex = updated.findIndex((p) => p.id === data.post.id);
            swiperRef.current.slideTo(newIndex >= 0 ? newIndex : updated.length - 1, 0);
          }
        }, 100);
        return updated;
      });
    } catch (err) {
      console.error("Error creating post:", err);
      alert("Erro ao criar post");
    }
  };

  if (loading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="space-y-4 w-full max-w-4xl p-6">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-48 w-full" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold text-destructive">Erro</h1>
          <p className="text-muted-foreground">{error}</p>
        </div>
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="h-screen w-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-bold">Nenhum post encontrado</h1>
          <p className="text-muted-foreground">
            Este calendário ainda não possui posts.
          </p>
        </div>
      </div>
    );
  }

  const currentPost = posts[currentPostIndex];

  return (
    <>
      {/* Header */}
      <Header
        clientName={clientName}
        currentStatus={currentPost?.status || "pending"}
        onStatusChange={(status) =>
          currentPost && handleStatusChange(currentPost.id, status)
        }
        onCalendarClick={() => setCalendarOpen(true)}
        canApprove={isAdmin || permissions.canApprove}
        reviewerName={!isAdmin ? reviewerName : null}
      />

      {/* Navigation Arrows - aligned with date bar center */}
      <button 
        className="swiper-button-prev-custom fixed z-30 flex items-center justify-center w-10 h-10 rounded-full bg-background border hover:bg-accent transition-colors cursor-pointer" 
        style={{ left: '24px', top: '75px' }}
        data-action="prev-slide"
        id="nav-arrow-prev"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
      </button>

      <button 
        className="swiper-button-next-custom fixed z-30 flex items-center justify-center w-10 h-10 rounded-full bg-background border hover:bg-accent transition-colors cursor-pointer" 
        style={{ right: '24px', top: '75px' }}
        data-action="next-slide"
        id="nav-arrow-next"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
      </button>


      {/* Swiper */}
      <Swiper
        modules={[Navigation, Keyboard]}
        navigation={{
          prevEl: '.swiper-button-prev-custom',
          nextEl: '.swiper-button-next-custom',
        }}
        keyboard={{ enabled: true }}
        mousewheel={false}
        allowTouchMove={true}
        spaceBetween={0}
        slidesPerView={1}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          setCurrentPostIndex(swiper.activeIndex);
          // Update current month when slide changes
          if (posts[swiper.activeIndex]) {
            setCurrentMonth(new Date(posts[swiper.activeIndex].scheduledAt));
          }
        }}
        className="w-full h-screen"
        id="posts-swiper"
        data-component="swiper"
      >
        {posts.map((post) => {
          const postDate = new Date(post.scheduledAt).toISOString().split("T")[0];
          const sameDayPosts = posts.filter(
            (p) => new Date(p.scheduledAt).toISOString().split("T")[0] === postDate
          );
          const dayPostCount = sameDayPosts.length;
          const dayPostIndex = sameDayPosts.findIndex((p) => p.id === post.id) + 1;

          return (
            <SwiperSlide key={post.id}>
              {isAdmin ? (
                <PostSlideEditable
                  post={post}
                  clientName={clientName}
                  isAdmin={isAdmin}
                  onCommentAdd={handleCommentAdd}
                  onPostUpdate={handlePostUpdate}
                  onPostDelete={handlePostDelete}
                  onAddPostToDay={handleAddPostToDay}
                  onAttachmentAdd={handleAttachmentAdd}
                  onAttachmentVersionAdd={handleAttachmentVersionAdd}
                  onAttachmentVersionUpdate={handleAttachmentVersionUpdate}
                  onPinCreate={handlePinCreate}
                  onPinResolve={handlePinResolve}
                  onPinDelete={handlePinDelete}
                  onDelegate={setHandoffPost}
                  dayPostIndex={dayPostIndex}
                  dayPostCount={dayPostCount}
                />
              ) : (
                <PostSlide
                  post={post}
                  clientName={clientName}
                  onCommentAdd={handleCommentAdd}
                  onPinCreate={permissions.canPin ? handlePinCreate : undefined}
                  onPinResolve={permissions.canPin ? handlePinResolve : undefined}
                  onPinDelete={permissions.canPin ? handlePinDelete : undefined}
                  canComment={permissions.canComment}
                  canAnnotate={permissions.canPin}
                  dayPostIndex={dayPostIndex}
                  dayPostCount={dayPostCount}
                />
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      {/* Calendar Modal */}
      <CalendarModal
        open={calendarOpen}
        onOpenChange={setCalendarOpen}
        posts={posts}
        onDayClick={handleDayClick}
        currentMonth={currentMonth}
        isAdmin={isAdmin}
      />

      {handoffPost && (
        <PostHandoffDialog
          open={Boolean(handoffPost)}
          onOpenChange={(open) => !open && setHandoffPost(null)}
          postId={handoffPost.id}
          initialStage={handoffPost.productionStage || "draft_copy"}
          initialAssigneeId={handoffPost.assigneeId ?? null}
          members={teamMembers}
          onSuccess={handleHandoffSuccess}
        />
      )}
    </>
  );
}
