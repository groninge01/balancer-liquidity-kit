import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'Balancer Liquidity Kit Example',
  description: 'Custom UI example using @balancer/liquidity-kit',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
