const PATHS = {
  home: "M3 10.8 12 3.5l9 7.3|M6 9.6V20h12V9.6",
  doc: "M6.5 2.5h7l4.5 4.5V21.5h-11.5z|M13.5 2.5V7h4.5|M9 13h6|M9 17h4",
  bed: "M4 11V5h16v6|M3 11h18v8|M3 19v2|M21 19v2|M7.5 11V8.5h3V11",
  shirt:
    "M7.5 3 4 5.8 6.2 9.4l1.3-1V21h9V8.4l1.3 1L20 5.8 16.5 3l-2.3 2a3 3 0 0 1-4.4 0z",
  cal: "M3.5 5h17v16h-17z|M8 2.5V7|M16 2.5V7|M3.5 10.5h17",
  bell: "M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9|M10.3 21a2 2 0 0 0 3.4 0",
  search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14z|M20 20l-4-4",
  x: "M6 6l12 12|M18 6 6 18",
  right: "M9 5l7 7-7 7",
  back: "M19 12H5|M11 5l-7 7 7 7",
  chevD: "M6 9l6 6 6-6",
  down: "M12 3v13|M7 11l5 5 5-5|M4 21h16",
  share: "M12 16V3|M8 7l4-4 4 4|M4 14v5a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5",
  plus: "M12 5v14|M5 12h14",
  minus: "M5 12h14",
  check: "M4 12.5l5 5L20 6.5",
  pin: "M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11z|M12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z",
  shield:
    "M12 2.5 4.5 5.5v6c0 5 3.3 8.7 7.5 10 4.2-1.3 7.5-5 7.5-10v-6z|M8.8 12l2.2 2.2 4.2-4.4",
  chat: "M21 11.5a8.4 8.4 0 0 1-12.6 7.3L3 20.5l1.8-5.2A8.4 8.4 0 1 1 21 11.5z",
  full: "M4 9V4.5h5|M20 9V4.5h-5|M4 15v4.5h5|M20 15v4.5h-5",
  up: "M12 19V6|M7 11l5-5 5 5|M4 21h16",
  cam: "M4 8h3.5l1.5-2.5h6L16.5 8H20v12H4z|M12 17a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z",
  copy: "M9 9h11v11H9z|M5 15V4h11",
  retry: "M20 5v5h-5|M19.4 14a8 8 0 1 1-1.6-7.4L20 9",
  cap: "M2.5 8.5 12 4.5l9.5 4-9.5 4z|M6.5 11v5c0 1.4 2.5 2.5 5.5 2.5s5.5-1.1 5.5-2.5v-5",
  safari: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z|M15.5 8.5 13.5 13.5 8.5 15.5 10.5 10.5z",
  wifi: "M5 12.5a10 10 0 0 1 14 0|M8.5 16a5 5 0 0 1 7 0|M12 19.5h.01",
  wifiOff:
    "M2 2l20 20|M8.5 16a5 5 0 0 1 7 0|M12 19.5h.01|M5 12.5a10 10 0 0 1 5.2-2.7",
  drop: "M12 3.5c3 4 5.5 6.6 5.5 9.5a5.5 5.5 0 0 1-11 0c0-2.9 2.5-5.5 5.5-9.5z",
  bolt: "M13 2.5 5 13.5h6l-1 8 8-11h-6z",
  lock: "M6 11h12v9H6z|M8.5 11V8a3.5 3.5 0 0 1 7 0v3",
  flag: "M5 21V4h13l-2.5 4.5L18 13H5",
  inbox: "M3 13h5l1.5 3h5L16 13h5|M5.5 5h13l2.5 8v6H3v-6z",
  warn: "M12 9v4.5|M12 17h.01|M10.3 3.9 2.4 17a2 2 0 0 0 1.7 3h15.8a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z",
} as const;

export type IconName = keyof typeof PATHS;

export function Icon({
  name,
  size = 22,
  strokeWidth = 1.7,
  className,
}: {
  name: IconName;
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {PATHS[name].split("|").map((d, i) => (
        <path key={i} d={d} />
      ))}
    </svg>
  );
}

export const CheckIcon = (p: { size?: number }) => <Icon name="check" size={p.size} strokeWidth={2.3} />;
export const WarnIcon = (p: { size?: number }) => <Icon name="warn" size={p.size} strokeWidth={1.9} />;
