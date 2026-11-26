import Image from "next/image";
import Link from "next/link";
import { images } from "@/lib/images";
import "./page.css";

function Arrow() {
  return (
    <svg
      width="18"
      height="18"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      aria-hidden="true"
    >
      <path d="M5 12h14M13 6l6 6-6 6" />
    </svg>
  );
}

export default function ChoosePathPage() {
  return (
    <main className="choose-page">
      <section className="choose-photo">
        <div className="choose-photo-media">
          <Image
            src={images.choosePath}
            alt="ZamLine truck on the road"
            fill
            priority
            sizes="(max-width: 1023px) 100vw, 50vw"
          />
        </div>
        <div className="choose-logo">
          <Image
            src={images.logo}
            alt="ZamLine"
            width={95}
            height={105}
            priority
          />
        </div>
      </section>

      <section className="choose-panel">
        <div className="choose-content">
          <p className="choose-eyebrow">ZamLine Platform</p>
          <h1 className="choose-title">
            Move freight with better information.
          </h1>

          <p className="choose-label">Choose your path</p>

          <div className="choose-option">
            <h2>Shipper</h2>
            <p>
              Post freight opportunities and connect with suitable fleet
              companies.
            </p>
            <Link href="/shipper/signup" className="choose-button">
              Continue as Shipper <Arrow />
            </Link>
          </div>

          <div className="choose-option">
            <h2>Fleet Manager</h2>
            <p>
              Set up your fleet, review suitable freight and assess
              opportunities.
            </p>
            <Link href="/fleet/signup" className="choose-button">
              Continue as Fleet manager <Arrow />
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
