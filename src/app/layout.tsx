import "./globals.css";
export const metadata = {
  title: "FitGym",
  description: "Administración de gimnasio",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}