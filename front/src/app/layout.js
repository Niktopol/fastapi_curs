import { Inter } from "next/font/google";
import { Toaster } from "react-hot-toast";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata = {
  title: "File Exchanger",
  description: "Simple file sharing application",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Toaster position="top-center" />
        <main className="min-h-screen p-4 md:p-8 max-w-4xl mx-auto">
          {children}
        </main>
      </body>
    </html>
  );
}
