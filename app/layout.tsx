import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Payload — Test File Generator",
  description:
    "Generate blank test files at exact byte sizes for upload limits, bandwidth tests, and QA fixtures.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-[#EEF1F5] text-[#14181F]">
        {children}
      </body>
    </html>
  );
}
