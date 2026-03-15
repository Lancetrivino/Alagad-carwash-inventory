import './globals.css'

export const metadata = {
  title: 'Alagad Carwash — Inventory',
  description: 'Chemical stock management',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className="antialiased bg-gray-50 min-h-screen">
        {children}
      </body>
    </html>
  )
}