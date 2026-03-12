import "./globals.css";

export const metadata = {
  title: "PE Mittelstand Sales Agent",
  description: "KI-gestützte Lead-Generierung für Private Equity im deutschen Mittelstand",
};

export default function RootLayout({ children }) {
  return (
    <html lang="de">
      <body className="antialiased">{children}</body>
    </html>
  );
}
