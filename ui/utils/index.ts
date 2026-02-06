export const hexToRgb = (hex: string): number[] =>
  (hex.substring(1).match(/.{2}/g) ?? []).map((x) => parseInt(x, 16));
// .replace(
//   /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
//   (m, r, g, b) => "#" + r + r + g + g + b + b
// )

export const rgbToHex = (r: number, g: number, b: number): string =>
  "#" +
  [setValidColor(r), setValidColor(g), setValidColor(b)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");

const setValidColor = (n: number) => {
  if (n > 255) {
    return 255;
  }
  if (n < 0) {
    return 0;
  }
  return n;
};

export const isHexColorPart = (str: string): boolean => {
  const regex = /^[#abcdefABCDEF0123456789]+$/i;
  return regex.test(str);
};

export const cleanString = (s: string) => s.toLowerCase().trim();
