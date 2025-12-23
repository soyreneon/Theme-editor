import React, { FC, useRef, useState, useEffect } from "react";
import styles from "./eyedropper.module.css";
import { useStore } from "../../useStore";

interface EyeDropperProps {
  // (always 7 chars, lowercase)
  onChange: (hex: string) => void;
  color?: string;
}

const normalizeHex = (hex: string, defaultColor: string): string => {
  if (!hex) return defaultColor;
  const h = hex.trim().toLowerCase();
  // convert 3-digit to 6-digit
  if (/^#([0-9a-f]{3})$/i.test(h)) {
    return (
      "#" +
      h
        .slice(1)
        .split("")
        .map((c) => c + c)
        .join("")
    );
  }
  if (/^#([0-9a-f]{6})$/i.test(h)) return h;
  // fallback: try to extract hex
  const m = h.match(/#([0-9a-f]{6})/i);
  return m ? `#${m[1].toLowerCase()}` : defaultColor;
};

const SIZE = 22;
const EyeDropper: FC<EyeDropperProps> = ({ onChange, color = "#ffffff" }) => {
  const store = useStore();
  const { themeType } = store;
  const defaultNormalizedColor =
    themeType?.toLowerCase() === "dark" ? "#ffffff" : "#000000";
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [current, setCurrent] = useState<string>(
    normalizeHex(color, defaultNormalizedColor)
  );

  useEffect(() => {
    if (inputRef.current) {
      setCurrent(normalizeHex(color, defaultNormalizedColor));
      inputRef.current.value = current;
    }
  }, [color]);

  const handleNativePick = async () => {
    const isLinux = navigator.platform.toLowerCase().includes("linux");

    const canUseEyeDropper =
      typeof (window as any).EyeDropper === "function" && !isLinux;

    // Use native EyeDropper if available
    // const Win: any = window as any;
    if (!canUseEyeDropper) {
      // if (typeof Win.EyeDropper === "function") {
      try {
        // const picker = new Win.EyeDropper();
        const picker = new (window as any).EyeDropper();
        const result = await picker.open();
        // result.sRGBHex should be like "#RRGGBB"
        if (result && result.sRGBHex) {
          setCurrent(normalizeHex(result.sRGBHex, defaultNormalizedColor));
          onChange(normalizeHex(result.sRGBHex, defaultNormalizedColor));
        }
      } catch {
        // user cancelled or error - ignore
        inputRef.current?.click();
      }
      return;
    }
    // fallback to input color
    inputRef.current?.click();
  };

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    onChange(normalizeHex(val, defaultNormalizedColor));
  };

  return (
    <div
      className={styles.eyeDropperWrapper}
      aria-label="Pick color"
      role="button"
      onClick={handleNativePick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleNativePick();
        }
      }}
      tabIndex={0}
    >
      <div
        aria-hidden
        className={styles.colorCircle}
        style={{
          width: SIZE,
          height: SIZE,
          background: current,
        }}
      />
      <svg
        viewBox="0 0 512 512"
        height="1em"
        width="1em"
        style={{ pointerEvents: "none" }}
        aria-hidden
      >
        <path
          fill="currentColor"
          d="M482.8 29.23c38.9 38.98 38.9 102.17 0 141.17L381.2 271.9l9.4 9.5c12.5 12.5 12.5 32.7 0 45.2s-32.7 12.5-45.2 0l-160-160c-12.5-12.5-12.5-32.7 0-45.2s32.7-12.5 45.2 0l9.5 9.4L341.6 29.23c39-38.974 102.2-38.974 141.2 0zM55.43 323.3 176.1 202.6l45.3 45.3-120.7 120.7c-3.01 3-4.7 7-4.7 11.3V416h36.1c4.3 0 8.3-1.7 11.3-4.7l120.7-120.7 45.3 45.3-120.7 120.7c-15 15-35.4 23.4-56.6 23.4H89.69l-39.94 26.6c-12.69 8.5-29.59 6.8-40.377-4-10.786-10.8-12.459-27.7-3.998-40.4L32 422.3v-42.4c0-21.2 8.43-41.6 23.43-56.6z"
        />
      </svg>

      <input
        ref={inputRef}
        type="color"
        onChange={onInputChange}
        value={current}
        className={styles.eyeInput}
        aria-hidden
      />
    </div>
  );
};

export default EyeDropper;
