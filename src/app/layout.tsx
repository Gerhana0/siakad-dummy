import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Simulasi KRS",
  description:
    "Penelitian kemudahan pemilihan kelas pada sistem informasi akademik",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
