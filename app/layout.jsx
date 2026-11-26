import { Inter } from "next/font/google";
import Image from "next/image";
import { images } from "@/lib/images";
import ServiceWorker from "@/components/pwa/ServiceWorker";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-inter",
});

export const metadata = {
  title: "ZamLine",
  description:
    "Freight coordination for verified shippers and fleet companies in Zambia.",
  applicationName: "ZamLine",
  appleWebApp: {
    capable: true,
    title: "ZamLine",
    statusBarStyle: "default",
  },
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0b1f3a",
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={inter.variable}>
      <body>
        {children}
        <ServiceWorker />
        <div className="team-badge" title="Built by Team Nexa">
          <Image src={images.teamLogo} alt="Team Nexa" width={44} height={44} />
        </div>
      </body>
    </html>
  );
}
