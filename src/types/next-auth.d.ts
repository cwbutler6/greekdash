import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      memberships: {
        id: string;
        role: string;
        chapterId: string;
        chapterSlug: string;
      }[];
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    memberships: {
      id: string;
      role: string;
      chapterId: string;
      chapterSlug: string;
    }[];
  }
}
