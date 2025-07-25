import "@/styles/globals.css";
import {Metadata, Viewport} from "next";
import {Link} from "@heroui/link";
import clsx from "clsx";

import {Providers} from "./providers";
import SupabaseProvider from './supabase-provider';

import {siteConfig} from "@/config/site";
// import {fontSans} from "@/config/fonts";
import {Navbar} from "@/components/navbar";

import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'

export const metadata: Metadata = {
    title: {
        default: siteConfig.name,
        template: `%s - ${siteConfig.name}`,
    },
    description: siteConfig.description,
    icons: {
        icon: "/favicon.ico",
    },
};

export const viewport: Viewport = {
    themeColor: [
        {media: "(prefers-color-scheme: light)", color: "white"},
        {media: "(prefers-color-scheme: dark)", color: "black"},
    ],
};

export default function RootLayout({
                                       children,
                                   }: {
    children: React.ReactNode;
}) {
    return (
        <html suppressHydrationWarning lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <head><title></title></head>
        <body
            className={clsx(
                `min-h-screen text-foreground bg-background antialiased`
            )}
        >
        <Providers themeProps={{attribute: "class", defaultTheme: "white"}}>
            <SupabaseProvider>
                <div className="relative flex flex-col h-screen">
                    <Navbar />
                    <main className="flex-grow">
                        {children}
                    </main>
                    <footer className="w-full flex flex-col sm:flex-row items-center justify-between py-6 px-6 gap-4 border-t border-divider">
                        <div className="flex items-center gap-2 text-default-500 text-sm">
                            <span>© {new Date().getFullYear()}</span>
                            <Link
                                isExternal
                                className="text-primary hover:text-primary-600 transition-colors"
                                href="/"
                                title={siteConfig.name}
                            >
                                {siteConfig.name}
                            </Link>
                            <span>All rights reserved.</span>
                        </div>
                        <div className="flex items-center gap-4 text-default-500 text-sm">
                            <span className="flex items-center gap-1">Powered by</span>
                            <Link
                                isExternal
                                className="text-primary hover:text-primary-600 transition-colors"
                                href="https://heroui.com/"
                                title="HeroUI Homepage"
                            >
                                HeroUI
                            </Link>
                            <Link
                                isExternal
                                className="text-primary hover:text-primary-600 transition-colors"
                                href="https://supabase.com/"
                                title="Supabase Homepage"
                            >
                                Supabase
                            </Link>
                            <Link
                                isExternal
                                className="text-primary hover:text-primary-600 transition-colors"
                                href="https://nextjs.org/"
                                title="Next.js Homepage"
                            >
                                Next.js
                            </Link>
                        </div>
                    </footer>
                </div>
            </SupabaseProvider>
        </Providers>
        </body>
        </html>
    );
}
