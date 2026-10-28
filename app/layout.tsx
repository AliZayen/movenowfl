import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

// Brand font. globals.css reads it through --font-plus-jakarta-sans.
const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "MoveNow Miami | Moving, Furniture Assembly & TV Mounting",
    template: "%s | MoveNow Miami",
  },
  description:
    "Licensed and insured movers in Miami. Book moving, furniture assembly, and TV mounting with same-week availability. Get a free estimate in under 2 minutes.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${plusJakartaSans.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
