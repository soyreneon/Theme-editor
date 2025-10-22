import { type FC, useState, useEffect } from "react";
import {
  HsvaColor,
  HslaColor,
  hexToHsva,
  hsvaToHex,
  hsvaToHexa,
} from "@uiw/color-convert";

import Chrome, { ChromeInputType } from "@uiw/react-color-chrome";
import Compact from "@uiw/react-color-compact";
import { GithubPlacement } from "@uiw/react-color-github";
import { useStore } from "../../useStore";
import styles from "./colorbox.module.css";

interface ColorBoxProps {
  value: string;
  setValue: (color: string) => void;
  hasAlpha?: boolean;
  hasColorPalette?: boolean;
}

const ColorBox: FC<ColorBoxProps> = ({
  value,
  setValue,
  hasAlpha = false,
  hasColorPalette = false,
}) => {
  const store = useStore();
  const { colorOrders } = store;
  const [hsvaColor, setHsvaColor] = useState<HsvaColor>(hexToHsva(value));

  useEffect(() => {
    setHsvaColor(hexToHsva(value));
  }, [value]);

  return (
    <div className={styles.colorBoxPicker}>
      <Chrome
        color={hsvaColor}
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
        showTriangle={false}
        inputType={ChromeInputType.HEXA}
        onChange={(color) => {
          setHsvaColor(color.hsva);
          setValue(hasAlpha ? color.hexa : color.hex);
        }}
      />
      {hasColorPalette && (
        <Compact
          color={hsvaToHex(hsvaColor)}
          colors={colorOrders.all}
          className={styles.colorPalette}
          prefixCls={styles.colorPaletteBox}
          onChange={(color) => {
            setHsvaColor((oldColor) => {
              const newAplhaColor = {
                ...color.hsva,
                a: oldColor.a,
              };
              setValue(hasAlpha ? hsvaToHexa(newAplhaColor) : color.hex);
              return newAplhaColor;
            });
          }}
        />
      )}
    </div>
  );
};

export default ColorBox;
