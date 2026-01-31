import NextAuth from 'next-auth'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      name?: string | null
      email?: string | null
      image?: string | null
      githubId?: string | null
      credits: number
      bio?: string | null
    }
  }

  interface User {
    id: string
    githubId?: string | null
    credits: number
    bio?: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    githubId?: string
  }
}
