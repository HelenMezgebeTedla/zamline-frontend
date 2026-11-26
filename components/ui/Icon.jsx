const PATHS = {
  grid: ["M4 4h6v6H4z", "M14 4h6v6h-6z", "M4 14h6v6H4z", "M14 14h6v6h-6z"],
  route: [
    "M6 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    "M18 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    "M6 15V9a4 4 0 0 1 4-4h6",
    "M18 9v6a4 4 0 0 1-4 4H8",
  ],
  clipboardCheck: [
    "M9 3h6a1 1 0 0 1 1 1v2H8V4a1 1 0 0 1 1-1z",
    "M16 5h2a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2h2",
    "m9 14 2 2 4-4",
  ],
  truck: [
    "M2 5h12v11H2z",
    "M14 9h4l3 3v4h-7z",
    "M6 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    "M17 20a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
  ],
  sliders: [
    "M4 21v-7",
    "M4 10V3",
    "M12 21v-9",
    "M12 8V3",
    "M20 21v-5",
    "M20 12V3",
    "M1 14h6",
    "M9 8h6",
    "M17 16h6",
  ],
  plusSquare: [
    "M5 3h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M12 8v8",
    "M8 12h8",
  ],
  userCheck: [
    "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2",
    "M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
    "m16 11 2 2 4-4",
  ],
  user: [
    "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2",
    "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  ],
  logout: [
    "M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4",
    "m16 17 5-5-5-5",
    "M21 12H9",
  ],
  mapPin: [
    "M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0z",
    "M12 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
  ],
  calendar: [
    "M5 4h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "M16 2v4",
    "M8 2v4",
    "M3 10h18",
  ],
  package: ["m21 8-9-5-9 5 9 5 9-5z", "M3 8v8l9 5 9-5V8", "M12 13v8"],
  banknote: [
    "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1z",
    "M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6z",
    "M6 12h.01",
    "M18 12h.01",
  ],
  building: [
    "M4 21V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v16",
    "M16 9h2a2 2 0 0 1 2 2v10",
    "M2 21h20",
    "M8 7h4",
    "M8 11h4",
    "M8 15h4",
  ],
  phone: [
    "M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z",
  ],
  mail: [
    "M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z",
    "m22 6-10 7L2 6",
  ],
  search: ["M11 19a8 8 0 1 0 0-16 8 8 0 0 0 0 16z", "m21 21-4.3-4.3"],
  chevronDown: ["m6 9 6 6 6-6"],
  arrowLeft: ["M19 12H5", "m12 19-7-7 7-7"],
  arrowRight: ["M5 12h14", "m12 5 7 7-7 7"],
  shieldCheck: ["M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z", "m9 12 2 2 4-4"],
  file: [
    "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
    "M14 2v6h6",
  ],
  info: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 16v-4", "M12 8h.01"],
  lock: [
    "M5 11h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2z",
    "M7 11V7a5 5 0 0 1 10 0v4",
  ],
  calculator: [
    "M7 3h10a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z",
    "M8 7h8",
    "M8 12h.01",
    "M12 12h.01",
    "M16 12h.01",
    "M8 16h.01",
    "M12 16h.01",
    "M16 16h.01",
  ],
  menu: ["M3 6h18", "M3 12h18", "M3 18h18"],
  close: ["M18 6 6 18", "m6 6 12 12"],
  alert: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 8v4", "M12 16h.01"],
  clock: ["M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z", "M12 6v6l4 2"],
};

export default function Icon({ name, size = 18, className }) {
  return (
    <svg
      className={className ? `zl-icon ${className}` : "zl-icon"}
      style={{ "--zl-icon": `${size}px` }}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {PATHS[name].map((d) => (
        <path key={d} d={d} />
      ))}
    </svg>
  );
}
