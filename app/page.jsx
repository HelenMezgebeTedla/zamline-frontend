"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { images } from "@/lib/images";
import "./page.css";

const ICON_PATHS = {
  link: [
    "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71",
    "M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71",
  ],
  shield: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4"],
  zap: ["M13 2 3 14h9l-1 8 10-12h-9l1-8z"],
  calculator: [
    "M6 2h12a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z",
    "M8 6h8",
    "M8 11h.01M12 11h.01M16 11h.01M8 15h.01M12 15h.01M16 15h.01M8 19h.01M12 19h4",
  ],
  brain: [
    "M12 5a3 3 0 1 0-5.99.13A4 4 0 0 0 4 12a4 4 0 0 0 2 3.46A3 3 0 0 0 12 18z",
    "M12 5a3 3 0 1 1 5.99.13A4 4 0 0 1 20 12a4 4 0 0 1-2 3.46A3 3 0 0 1 12 18z",
    "M12 5v13",
  ],
  truck: [
    "M1 3h15v13H1z",
    "M16 8h4l3 3v5h-7z",
    "M5.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
    "M18.5 21a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  ],
  clipboard: [
    "M9 2h6a1 1 0 0 1 1 1v2H8V3a1 1 0 0 1 1-1z",
    "M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2",
    "M9 12h6M9 16h6",
  ],
};

function Icon({ name, size = 21 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {ICON_PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}

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

const SLIDES = [
  {
    eyebrow: "The platform",
    title: ["Smarter Freight", "for Zambia."],
    description:
      "ZamLine connects shippers and fleet managers through a single platform, making freight logistics simpler, faster and more reliable.",
    image: images.introPlatform,
    alt: "ZamLine truck on a Zambian road",
    features: [
      {
        icon: "link",
        title: "Connect",
        text: "Shippers post shipments and fleet managers find the right loads.",
      },
      {
        icon: "shield",
        title: "Verify",
        text: "Work with trusted and verified businesses.",
      },
      {
        icon: "zap",
        title: "Move",
        text: "Get your goods where they need to be.",
      },
    ],
  },
  {
    eyebrow: "AI powered insights",
    title: ["Know Your Costs", "Before You Commit."],
    description:
      "Our AI-powered cost estimation helps fleet managers compare proposed payment with estimated trip costs and understand potential profit or loss.",
    image: images.introCosts,
    alt: "Cargo loaded inside a truck trailer",
    features: [
      {
        icon: "calculator",
        title: "Accurate Cost Breakdown",
        text: "See fuel, driver, tolls, maintenance and more.",
      },
      {
        icon: "brain",
        title: "AI-Powered Analysis",
        text: "Get insights on estimated trip costs and margin.",
      },
      {
        icon: "shield",
        title: "Make Informed Decisions",
        text: "Review assumptions and uncertainty before deciding.",
      },
    ],
  },
  {
    eyebrow: "More than just loads",
    title: ["A Complete", "Freight Solution."],
    description: "Everything you need to manage your logistics, in one place.",
    image: images.introSolution,
    alt: "Truck at a warehouse loading bay at sunset",
    tagline: "Together we keep Zambia moving.",
    features: [
      {
        icon: "truck",
        title: "Fleet Management",
        text: "Register and manage your trucks, keeping fleet details up to date.",
      },
      {
        icon: "clipboard",
        title: "Shipment Management",
        text: "Post, track and manage shipments from start to finish.",
      },
      {
        icon: "link",
        title: "Smart Matching",
        text: "Connect the right loads with the right trucks.",
      },
    ],
  },
];

const LAST = SLIDES.length - 1;

export default function IntroPage() {
  const [index, setIndex] = useState(0);
  const [announcement, setAnnouncement] = useState("");
  const headingRef = useRef(null);
  const slide = SLIDES[index];

  useEffect(() => {
    if (announcement) headingRef.current?.focus();
  }, [index, announcement]);

  function goTo(next) {
    setIndex(next);
    setAnnouncement(
      `Step ${next + 1} of ${SLIDES.length}: ${SLIDES[next].eyebrow}`,
    );
  }

  return (
    <main className="intro-page">
      <section className="intro-photo">
        {SLIDES.map((item, i) => (
          <div
            key={item.image}
            className={`intro-photo-media ${i === index ? "is-active" : ""}`}
          >
            <Image
              src={item.image}
              alt={i === index ? item.alt : ""}
              fill
              priority={i === 0}
              sizes="(max-width: 1023px) 100vw, 46vw"
            />
          </div>
        ))}
        <div className="intro-shade" />
        <div className="intro-logo">
          <Image
            src={images.logo}
            alt="ZamLine"
            width={95}
            height={105}
            priority
          />
        </div>
        {slide.tagline && <p className="intro-tagline">{slide.tagline}</p>}
      </section>

      <section className="intro-panel">
        <p className="intro-sr-only" aria-live="polite" aria-atomic="true">
          {announcement}
        </p>
        <div className="intro-content" key={index}>
          <div className="intro-topline">
            <p className="intro-eyebrow">{slide.eyebrow}</p>
            <div
              className="intro-progress"
              aria-label={`Step ${index + 1} of ${SLIDES.length}`}
            >
              <span>
                {String(index + 1).padStart(2, "0")} /{" "}
                {String(SLIDES.length).padStart(2, "0")}
              </span>
              <div className="intro-progress-track">
                {SLIDES.map((item, i) => (
                  <span
                    key={item.eyebrow}
                    className={i <= index ? "is-active" : ""}
                  />
                ))}
              </div>
            </div>
          </div>

          <h1 className="intro-title" ref={headingRef} tabIndex={-1}>
            {slide.title[0]}
            <br />
            {slide.title[1]}
          </h1>
          <p className="intro-description">{slide.description}</p>

          <ul className="intro-features">
            {slide.features.map((feature) => (
              <li key={feature.title} className="intro-feature">
                <span className="intro-feature-icon">
                  <Icon name={feature.icon} />
                </span>
                <span>
                  <strong>{feature.title}</strong>
                  <span>{feature.text}</span>
                </span>
              </li>
            ))}
          </ul>

          <div className="intro-actions">
            {index < LAST ? (
              <>
                <button
                  type="button"
                  className="intro-button"
                  onClick={() => goTo(index + 1)}
                >
                  Next <Arrow />
                </button>
                <Link href="/choose-path" className="intro-skip">
                  Skip intro
                </Link>
              </>
            ) : (
              <>
                <Link href="/choose-path" className="intro-button">
                  Get Started <Arrow />
                </Link>
                <button
                  type="button"
                  className="intro-skip"
                  onClick={() => goTo(0)}
                >
                  Back to the start
                </button>
              </>
            )}
          </div>
        </div>
      </section>
    </main>
  );
}
