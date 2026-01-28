import type { Metadata } from 'next'
import { Inter, Noto_Sans_SC } from 'next/font/google'
import './globals.css'
import { ThemeProvider } from '@/components/providers/theme-provider'
import { Header } from '@/components/layout/header'
import { Footer } from '@/components/layout/footer'
import { Toaster } from 'sonner'

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

const notoSansSC = Noto_Sans_SC({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-noto-sans-sc',
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: 'GLM Skills Hub - AI Agent Skills 中文聚合平台',
    template: '%s | GLM Skills Hub',
  },
  description: '收集、整理、展示 Claude Skills 和其他 AI Agent 技能，提供中文介绍、使用指南和在线试用服务',
  keywords: ['Claude Skills', 'AI Agent', 'Skills Hub', '技能市场', '中文本地化', 'Claude Code'],
  authors: [{ name: 'GLM Skills Hub' }],
  creator: 'GLM Skills Hub',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    title: 'GLM Skills Hub - AI Agent Skills 中文聚合平台',
    description: '收集、整理、展示 Claude Skills 和其他 AI Agent 技能，提供中文介绍、使用指南和在线试用服务',
    siteName: 'GLM Skills Hub',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'GLM Skills Hub - AI Agent Skills 中文聚合平台',
    description: '收集、整理、展示 Claude Skills 和其他 AI Agent 技能',
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" suppressHydrationWarning className={`${inter.variable} ${notoSansSC.variable}`}>
      <body className={`${inter.className} ${notoSansSC.className} font-sans antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <Toaster richColors position="top-center" />
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
