/*
 * Safari picks a startup image only when the media query matches the device
 * exactly — there is no fallback and no wildcard, so every iPhone size has to
 * be named or that device gets plain white. Portrait only: the manifest locks
 * the app to portrait.
 */
const IPHONES: { w: number; h: number; r: number }[] = [
  { w: 320, h: 568, r: 2 }, // SE 1
  { w: 375, h: 667, r: 2 }, // 8, SE 2/3
  { w: 414, h: 736, r: 3 }, // 8 Plus
  { w: 375, h: 812, r: 3 }, // X, XS, 11 Pro, 12/13 mini
  { w: 414, h: 896, r: 2 }, // XR, 11
  { w: 414, h: 896, r: 3 }, // XS Max, 11 Pro Max
  { w: 390, h: 844, r: 3 }, // 12, 13, 14
  { w: 393, h: 852, r: 3 }, // 14 Pro, 15, 15 Pro, 16
  { w: 402, h: 874, r: 3 }, // 16 Pro
  { w: 428, h: 926, r: 3 }, // 12/13 Pro Max, 14 Plus
  { w: 430, h: 932, r: 3 }, // 14 Pro Max, 15 Plus/Pro Max, 16 Plus
  { w: 440, h: 956, r: 3 }, // 16 Pro Max
];

export function AppleSplashLinks() {
  return (
    <>
      {IPHONES.map(({ w, h, r }) => (
        <link
          key={`${w}x${h}@${r}`}
          rel="apple-touch-startup-image"
          media={`(device-width: ${w}px) and (device-height: ${h}px) and (-webkit-device-pixel-ratio: ${r}) and (orientation: portrait)`}
          href={`/splash?w=${w * r}&h=${h * r}`}
        />
      ))}
    </>
  );
}
