import NextAuth, { CredentialsSignin } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import type { Provider } from "next-auth/providers";
import { ensureOrganizationForUser } from "@/lib/ensure-organization";
import { normalizeEmail } from "@/lib/email-address";
import { consumeLoginCode } from "@/lib/login-code";
import { clientIp, hitRateLimit } from "@/lib/rate-limit";
import { secureGoogleLink } from "@/lib/google-link";

class RateLimited extends CredentialsSignin {
  code = "rate_limited";
}

// Hash fixo para gastar o mesmo tempo quando o e-mail não existe (sem oráculo de timing).
const DUMMY_HASH = "$2b$12$olanynHNoTsMQJpr44X6ZOBwwpkzc63dTsMPk81656h0wNd.1woh6";

const passwordCredentials = z.object({
  email: z.string().min(1).max(254),
  password: z.string().min(1).max(128),
});

const codeCredentials = z.object({
  email: z.string().min(1).max(254),
  code: z.string().regex(/^\d{6}$/),
});

async function throttle(request: Request, email: string) {
  const [byIp, byEmail] = await Promise.all([
    hitRateLimit("loginIp", clientIp(request.headers)),
    hitRateLimit("loginEmail", email),
  ]);
  if (!byIp.ok || !byEmail.ok) throw new RateLimited();
}

const providers: Provider[] = [
  Credentials({
    id: "credentials",
    name: "credentials",
    credentials: {
      email: { label: "Email", type: "email" },
      password: { label: "Senha", type: "password" },
    },
    async authorize(credentials, request) {
      const parsed = passwordCredentials.safeParse(credentials);
      if (!parsed.success) return null;
      const email = normalizeEmail(parsed.data.email);

      await throttle(request, email);

      const user = await prisma.user.findUnique({ where: { email } });
      const isValid = await bcrypt.compare(parsed.data.password, user?.password ?? DUMMY_HASH);

      if (!user?.password || !isValid) return null;

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
  Credentials({
    // Login por código enviado ao e-mail (/invite). O código é de uso único,
    // com no máximo 5 tentativas; entrar assim prova a posse do e-mail.
    id: "email-code",
    name: "email-code",
    credentials: {
      email: { label: "Email", type: "email" },
      code: { label: "Código", type: "text" },
    },
    async authorize(credentials, request) {
      const parsed = codeCredentials.safeParse(credentials);
      if (!parsed.success) return null;
      const email = normalizeEmail(parsed.data.email);

      await throttle(request, email);

      if (!(await consumeLoginCode(email, parsed.data.code))) return null;

      const user = await prisma.user.findUnique({ where: { email } });
      if (!user) return null;

      if (!user.emailVerified) {
        await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      }

      return { id: user.id, email: user.email, name: user.name, image: user.image };
    },
  }),
];

const googleClientId = process.env.AUTH_GOOGLE_ID || process.env.GOOGLE_CLIENT_ID;
const googleClientSecret =
  process.env.AUTH_GOOGLE_SECRET || process.env.GOOGLE_CLIENT_SECRET;

if (googleClientId && googleClientSecret) {
  providers.push(
    Google({
      clientId: googleClientId,
      clientSecret: googleClientSecret,
      // Google confirma o e-mail. Vincular evita uma segunda conta para quem já entrou
      // com senha; o callback signIn tira a senha de contas cujo e-mail nunca foi provado.
      allowDangerousEmailAccountLinking: true,
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    })
  );
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  session: { strategy: "jwt" },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
  },
  providers,
  events: {
    async createUser({ user }) {
      if (!user.id) return;
      // Só o adapter (Google) cria usuários aqui, e o Google já verificou o e-mail.
      await prisma.user.update({ where: { id: user.id }, data: { emailVerified: new Date() } });
      await ensureOrganizationForUser({
        id: user.id,
        name: user.name,
        email: user.email,
      });
    },
  },
  callbacks: {
    async signIn({ account, profile }) {
      if (account?.provider !== "google") return true;
      const googleProfile = profile as
        | { email?: string; email_verified?: boolean; emailVerified?: boolean }
        | undefined;
      const email = googleProfile?.email ?? "";
      const verified =
        googleProfile?.email_verified === true || googleProfile?.emailVerified === true;
      if (!email || !verified) return false;

      await secureGoogleLink(normalizeEmail(email));
      return true;
    },
    async jwt({ token, user }) {
      if (user?.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: user.id },
          select: { sessionVersion: true },
        });
        token.id = user.id;
        token.sv = dbUser?.sessionVersion ?? 0;
        await ensureOrganizationForUser({
          id: user.id,
          name: user.name,
          email: user.email,
        });
        return token;
      }

      if (!token.id) return null;

      // A cada leitura da sessão: usuário removido ou sessão revogada (troca de senha)
      // derruba o JWT. Nome/foto vêm do banco, nunca do cliente.
      const current = await prisma.user.findUnique({
        where: { id: token.id as string },
        select: { sessionVersion: true, name: true, image: true, email: true },
      });
      if (!current || current.sessionVersion !== ((token.sv as number | undefined) ?? 0)) {
        return null;
      }

      token.name = current.name;
      token.picture = current.image;
      token.email = current.email;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
});
