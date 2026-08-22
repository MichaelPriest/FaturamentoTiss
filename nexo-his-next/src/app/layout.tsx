import type { Metadata } from 'next';import './globals.css';import { brand } from '@/components/brand';
export const metadata:Metadata={title:{default:brand.name,template:`%s · ${brand.name}`},description:brand.description};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="pt-BR"><body>{children}</body></html>}
