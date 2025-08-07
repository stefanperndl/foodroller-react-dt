import '../index.css'

export const metadata = {
  title: 'Foodroller',
  description: 'Rolls food.',
}
 
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div id="root">{children}</div>
      </body>
    </html>
  )
}