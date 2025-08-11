import { useState, type FC } from "react";
import { type ColorMap } from "../../../types";
import { vscode, useStore } from "../../useStore";
import TypeList from "../TypeList";
import Modal from "../Modal";
import styles from "./content.module.css";
import Tooltip from "../Tooltip";

interface AccordionContentProps {
  color: string;
  colormaps: ColorMap;
}

const AccordionContent: FC<AccordionContentProps> = ({ color, colormaps }) => {
  const store = useStore();
  const { translations } = store;
  const { colorsMap, tokenColorsMap, syntaxMap } = colormaps;
  const [inputValue, setInputValue] = useState(color);
  const [isModalShown, setIsModalShown] = useState<boolean>(false);

  const handleSave = () => {
    if (color === inputValue) return;
    vscode.postMessage({
      command: "save",
      old: color,
      color: inputValue,
      name: "",
    });
  };

  const handleModal = (isAccepted: boolean) => {
    if (isAccepted) {
      vscode.postMessage({
        command: "reset",
        color: inputValue,
      });
    }
    setIsModalShown(false);
  };

  // .replace(
  //   /^#?([a-f\d])([a-f\d])([a-f\d])$/i,
  //   (m, r, g, b) => "#" + r + r + g + g + b + b
  // )
  const hexToRgb = (hex: string): number[] =>
    (hex.substring(1).match(/.{2}/g) ?? []).map((x) => parseInt(x, 16));

  const rgbToHex = (r: number, g: number, b: number): string =>
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

  const handleBrightness = (increase: boolean) => {
    const rgbColor = hexToRgb(inputValue);
    const step = 5;
    let newColor;
    if (increase) {
      newColor = rgbToHex(
        rgbColor[0] + step,
        rgbColor[1] + step,
        rgbColor[2] + step
      );
    } else {
      newColor = rgbToHex(
        rgbColor[0] - step,
        rgbColor[1] - step,
        rgbColor[2] - step
      );
    }
    setInputValue(newColor);
  };

  const handleReset = () => {
    setIsModalShown(true);
  };

  const onResetColorPicker = () => {
    setInputValue(color);
  };

  return (
    <div className={styles.content}>
      <label htmlFor="colopicker" className={styles.colorLabel}>
        {translations["Choose a new color"]}:
      </label>
      <div className={styles.colorContainer}>
        <input
          type="color"
          name="colopicker"
          value={inputValue}
          className="color-input"
          onChange={(e) => setInputValue(e.target.value)}
        />
        <span className={styles.colorValue}>{inputValue}</span>
        <section className={styles.brightness}>
          <i className="codicon codicon-lightbulb"></i>
          <div>
            <Tooltip
              caption={translations["less brightness"]}
              direction="bottom"
            >
              <button
                type="button"
                className="vscode-action-button"
                onClick={() => handleBrightness(false)}
              >
                <i className="codicon codicon-chrome-minimize"></i>
              </button>
            </Tooltip>
            <Tooltip
              caption={translations["more brightness"]}
              direction="bottom"
            >
              <button
                type="button"
                className="vscode-action-button"
                onClick={() => handleBrightness(true)}
              >
                <i className="codicon codicon-add"></i>
              </button>
            </Tooltip>
          </div>
        </section>

        <Tooltip caption={translations["reload color"]} direction="bottom">
          <button
            type="button"
            className="vscode-action-button"
            onClick={onResetColorPicker}
          >
            <i className="codicon codicon-refresh"></i>
          </button>
        </Tooltip>
      </div>
      <div className={styles.btnContainer}>
        <button className="vscode-button secondary block" onClick={handleSave}>
          <span className="vscode-button__text">{translations["Save"]}</span>
        </button>
        <button className="vscode-button block" onClick={handleReset}>
          <span className="vscode-button__text">{translations["Reset"]}</span>
        </button>
      </div>
      {isModalShown && (
        <Modal
          onAccept={handleModal}
          message={
            translations[
              "Are you sure you want to reset this color?, it will revert to the default theme value."
            ]
          }
        />
      )}
      <div className={styles.typesContainer}>
        <TypeList
          list={colorsMap[color]}
          link="https://code.visualstudio.com/api/references/theme-color"
          title={translations["Colors"]}
        />
        {tokenColorsMap[color] && (
          <TypeList
            list={tokenColorsMap[color].scope}
            link="https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide"
            title={translations["Token Colors"]}
          />
        )}
        <TypeList
          list={syntaxMap[color]}
          link="https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide"
          title={translations["Syntax Colors"]}
        />
      </div>
    </div>
  );
};

export default AccordionContent;
