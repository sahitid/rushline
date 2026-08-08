import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "rushline — recruit with an insider's edge",
  description:
    "rushline aggregates real, scraped signals into personalized club pages so any student can recruit with an insider's information advantage.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full">{children}</body>
    </html>
  );
}
