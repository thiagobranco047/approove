import { prisma } from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("🌱 Starting seed...");

  const hashedPassword = await bcrypt.hash("admin123", 12);

  // Create admin user
  const admin = await prisma.user.upsert({
    where: { email: "admin@approove.com" },
    update: { password: hashedPassword },
    create: {
      email: "admin@approove.com",
      password: hashedPassword,
      name: "Admin",
    },
  });

  console.log("✅ Admin user created:", admin.email);
  console.log("   Password: admin123");

  // Create organization
  const organization = await prisma.organization.upsert({
    where: { slug: "agencia-demo" },
    update: {},
    create: {
      name: "Agência Demo",
      slug: "agencia-demo",
    },
  });

  console.log("✅ Organization created:", organization.name);

  // Create membership (owner)
  await prisma.membership.upsert({
    where: {
      userId_organizationId: {
        userId: admin.id,
        organizationId: organization.id,
      },
    },
    update: {},
    create: {
      userId: admin.id,
      organizationId: organization.id,
      role: "owner",
    },
  });

  console.log("✅ Membership created: owner");

  const memberPassword = await bcrypt.hash("member123", 12);
  const teamSeed = [
    { email: "copy@approove.com", name: "Ana Copywriter", role: "member" as const },
    { email: "design@approove.com", name: "Bruno Designer", role: "member" as const },
    { email: "review@approove.com", name: "Carla Revisora", role: "admin" as const },
  ];

  const teamUsers: Record<string, { id: string; email: string }> = {};

  for (const member of teamSeed) {
    const user = await prisma.user.upsert({
      where: { email: member.email },
      update: { password: memberPassword, name: member.name },
      create: {
        email: member.email,
        password: memberPassword,
        name: member.name,
      },
    });

    await prisma.membership.upsert({
      where: {
        userId_organizationId: {
          userId: user.id,
          organizationId: organization.id,
        },
      },
      update: { role: member.role },
      create: {
        userId: user.id,
        organizationId: organization.id,
        role: member.role,
      },
    });

    teamUsers[member.email] = user;
    console.log(`✅ Team member: ${member.email} (${member.name})`);
  }

  console.log("   Team password: member123");

  // Create client
  const client = await prisma.client.upsert({
    where: { slug: "demo-client" },
    update: {},
    create: {
      organizationId: organization.id,
      slug: "demo-client",
      name: "Cliente Demo",
    },
  });

  console.log("✅ Client created:", client.slug);

  // Create calendar version
  const version = await prisma.calendarVersion.upsert({
    where: {
      clientId_version: {
        clientId: client.id,
        version: "v1",
      },
    },
    update: {},
    create: {
      clientId: client.id,
      version: "v1",
    },
  });

  console.log("✅ Version created:", version.version);

  // Create share token
  const shareToken = await prisma.shareToken.upsert({
    where: { token: "demo-token-123" },
    update: { expiresAt: null },
    create: {
      token: "demo-token-123",
      calendarVersionId: version.id,
      expiresAt: null,
    },
  });

  console.log("✅ Share token created:", shareToken.token);

  // Delete existing posts to avoid duplicates
  await prisma.postItem.deleteMany({
    where: { calendarVersionId: version.id },
  });

  interface AttachmentDef {
    type: string;
    label?: string;
    url?: string;
    urls?: string[];
    extraVersions?: string[];
  }

  interface PostDef {
    scheduledAt: Date;
    channel: string;
    copyText: string;
    status: "pending" | "approved" | "adjustments";
    productionStage?: string;
    assigneeEmail?: string;
    handoffNote?: string;
    attachments: AttachmentDef[];
  }

  const posts: PostDef[] = [
    {
      scheduledAt: new Date("2026-06-14T09:00:00"),
      channel: "Instagram",
      copyText:
        "📝 Rascunho de planejamento — post só com copy por enquanto.\n\nTema: bastidores da equipe criativa.\nCTA: salve para se inspirar depois.\n\n#Planejamento #Copy",
      status: "pending",
      productionStage: "waiting_design",
      assigneeEmail: "design@approove.com",
      handoffNote: "Copy validada no planejamento — montar feed + stories",
      attachments: [],
    },
    {
      scheduledAt: new Date("2026-06-15T10:00:00"),
      channel: "Instagram",
      copyText:
        "🚀 Novidades chegando! Fique ligado no nosso Instagram para não perder nada.\n\n#Marketing #SocialMedia #Digital",
      status: "pending",
      attachments: [
        {
          type: "carousel",
          urls: [
            "https://picsum.photos/seed/demo-carousel-1/1080/1080",
            "https://picsum.photos/seed/demo-carousel-2/1080/1080",
            "https://picsum.photos/seed/demo-carousel-3/1080/1080",
          ],
        },
        { type: "post_stories", url: "https://picsum.photos/seed/demo-post-1-stories/1080/1920" },
      ],
    },
    {
      scheduledAt: new Date("2026-06-15T14:00:00"),
      channel: "Instagram",
      copyText:
        "📸 Bastidores do nosso dia! Conheça um pouco mais da rotina da equipe criativa.\n\nSalve este post para se inspirar depois! 💡\n\n#Bastidores #Equipe #Criatividade",
      status: "approved",
      attachments: [
        {
          type: "post_feed",
          url: "https://picsum.photos/seed/demo-post-2-feed/1080/1080",
          extraVersions: ["https://picsum.photos/seed/demo-post-2-feed-v2/1080/1080"],
        },
        { type: "post_stories", url: "https://picsum.photos/seed/demo-post-2-stories/1080/1920" },
      ],
    },
    {
      scheduledAt: new Date("2026-06-15T18:00:00"),
      channel: "Instagram",
      copyText:
        "🔥 Enquete do dia: Qual tipo de conteúdo vocês preferem?\n\nA) Dicas rápidas\nB) Tutoriais detalhados\n\nResponda nos stories! 📊",
      status: "adjustments",
      attachments: [
        { type: "post_stories", url: "https://picsum.photos/seed/demo-post-3-stories/1080/1920" },
      ],
    },
    {
      scheduledAt: new Date("2026-06-16T14:30:00"),
      channel: "Facebook",
      copyText:
        "📱 Dica do dia: Como aumentar o engajamento nas suas redes sociais?\n\n1. Poste conteúdo relevante\n2. Interaja com seus seguidores\n3. Use hashtags estratégicas\n\nQuer saber mais? Comente aqui embaixo! 👇",
      status: "pending",
      attachments: [
        { type: "post_feed", url: "https://picsum.photos/seed/demo-post-4-feed/1080/1080" },
      ],
    },
    {
      scheduledAt: new Date("2026-06-17T16:00:00"),
      channel: "LinkedIn",
      copyText:
        "💼 O futuro do marketing digital está aqui.\n\nNossa equipe está sempre em busca das melhores estratégias para fazer seu negócio crescer.\n\nVamos conversar sobre como podemos ajudar você?\n\n#MarketingDigital #Negócios #Inovação",
      status: "approved",
      attachments: [
        { type: "post_linkedin", url: "https://picsum.photos/seed/demo-post-5-linkedin/1080/1080" },
      ],
    },
    {
      scheduledAt: new Date("2026-06-18T11:00:00"),
      channel: "Instagram",
      copyText:
        "✨ Segunda-feira começando com energia!\n\nQue tal definir suas metas da semana? Compartilhe conosco nos comentários! 💪\n\n#SegundaFeira #Motivação #Metas",
      status: "adjustments",
      attachments: [
        {
          type: "post_feed",
          url: "https://picsum.photos/seed/demo-post-6-feed/1080/1080",
          extraVersions: [
            "https://picsum.photos/seed/demo-post-6-feed-v2/1080/1080",
            "https://picsum.photos/seed/demo-post-6-feed-v3/1080/1080",
          ],
        },
        { type: "post_stories", url: "https://picsum.photos/seed/demo-post-6-stories/1080/1920" },
      ],
    },
    {
      scheduledAt: new Date("2026-06-20T09:00:00"),
      channel: "Instagram",
      copyText:
        "🎯 Planejamento é tudo!\n\nDescubra como um calendário editorial bem estruturado pode transformar sua estratégia de conteúdo.\n\nLink na bio! 🔗\n\n#ConteudoDigital #Planejamento #Estrategia",
      status: "pending",
      attachments: [
        { type: "post_feed", url: "https://picsum.photos/seed/demo-post-7-feed/1080/1080" },
        { type: "post_stories", url: "https://picsum.photos/seed/demo-post-7-stories/1080/1920" },
        { type: "reels_cover", url: "https://picsum.photos/seed/demo-post-7-reels/1080/1920" },
      ],
    },
    {
      scheduledAt: new Date("2026-06-22T15:00:00"),
      channel: "Facebook",
      copyText:
        "🌟 Cliente satisfeito = Sucesso garantido!\n\nVeja o que nossos clientes estão dizendo sobre nosso trabalho.\n\nQuer fazer parte dessa história de sucesso? Entre em contato! 📞\n\n#Depoimentos #Clientes #Sucesso",
      status: "approved",
      attachments: [
        { type: "post_feed", url: "https://picsum.photos/seed/demo-post-8-feed/1080/1080" },
      ],
    },
  ];

  for (const postData of posts) {
    const assignee = postData.assigneeEmail
      ? teamUsers[postData.assigneeEmail]
      : undefined;

    const post = await prisma.postItem.create({
      data: {
        calendarVersionId: version.id,
        scheduledAt: postData.scheduledAt,
        channel: postData.channel,
        copyText: postData.copyText,
        status: postData.status,
        productionStage: postData.productionStage ?? "draft_copy",
        assigneeId: assignee?.id ?? null,
        assignedAt: assignee ? new Date() : null,
        assignedById: assignee ? admin.id : null,
        handoffNote: postData.handoffNote ?? null,
      },
    });

    for (let i = 0; i < postData.attachments.length; i++) {
      const att = postData.attachments[i];
      const slideUrls = att.urls ?? (att.url ? [att.url] : []);
      if (slideUrls.length === 0) continue;

      const attachment = await prisma.postAttachment.create({
        data: {
          postItemId: post.id,
          type: att.type,
          label: att.label,
          order: i,
        },
      });

      await prisma.attachmentVersion.create({
        data: {
          postAttachmentId: attachment.id,
          url: slideUrls[0],
          version: 1,
          slides: {
            create: slideUrls.map((slideUrl, order) => ({
              url: slideUrl,
              order,
              mediaType: "image",
            })),
          },
        },
      });

      if (att.extraVersions) {
        for (let v = 0; v < att.extraVersions.length; v++) {
          await prisma.attachmentVersion.create({
            data: {
              postAttachmentId: attachment.id,
              url: att.extraVersions[v],
              version: v + 2,
              slides: {
                create: [{ url: att.extraVersions[v], order: 0, mediaType: "image" }],
              },
            },
          });
        }
      }
    }
  }

  console.log(`✅ Created ${posts.length} posts with attachments and versions`);

  console.log("\n🎉 Seed completed!");
  console.log("\n📝 Admin: admin@approove.com / admin123");
  console.log("📝 Time (Agência Demo): copy@ / design@ / review@approove.com — senha member123");
  console.log(
    "📝 Client URL: http://localhost:3000/c/demo-client/v1?t=demo-token-123"
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
