import { type FC } from "react";
// import {
//   HsvaColor,
//   hsvaToRgbaString,
//   color as handleColor,
//   validHex,
//   hexToHsva,
//   hsvaToHex,
//   hsvaToHexa,
// } from "@uiw/color-convert";

import Chrome from "@uiw/react-color-chrome";
import { GithubPlacement } from "@uiw/react-color-github";
import styles from "./colorbox.module.css";

interface ColorBoxProps {
  value: string;
  setValue: (color: string) => void;
  hasAlpha?: boolean;
}

const ColorBox: FC<ColorBoxProps> = ({ value, setValue, hasAlpha = false }) => {
  return (
    <div className={styles.colorBoxPicker}>
      <Chrome
        color={value}
        style={{
          marginTop: 10,
          marginBottom: 10,
          width: "100%",
          maxWidth: "500px",
          background: "var(--vscode-editor-background)",
          color: "var(--vscode-input-foreground)",
        }}
        className={styles.swatch}
        placement={GithubPlacement.TopLeft}
        showAlpha={hasAlpha}
        onChange={(color) => {
          setValue(color.hex);
        }}
      />
    </div>
  );
};

export default ColorBox;
