import { useState, useRef, type FC } from "react";
import { type ColorMap } from "../../../types";
import { hexToRgb, rgbToHex } from "../../utils";
import { vscode, useStore } from "../../useStore";
import TypeList from "../TypeList";
import ActionButton from "../ActionButton";
import ColorBox from "../ColorBox";
import Modal from "../Modal";
import ColorPickerModal from "../ColorPickerModal";
import styles from "./content.module.css";

interface AccordionContentProps {
  color: string;
  colormaps: ColorMap;
  hasCustomizations: boolean;
}

const AccordionContent: FC<AccordionContentProps> = ({
  color,
  colormaps,
  hasCustomizations,
}) => {
  const store = useStore();
  const { translations, colors } = store;
  const { colorsMap, tokenColorsMap, syntaxMap, semanticTokenColorMap } =
    colormaps;
  const [inputValue, setInputValue] = useState(color);
  const colorNameRef = useRef<HTMLInputElement>(null);
  const [modalStatus, setModalStatus] = useState<{
    status: boolean;
    type: string;
  }>({ status: false, type: "" });

  const handleSave = () => {
    if (color === inputValue) return;
    if (colors.includes(inputValue)) {
      setModalStatus({ status: true, type: "overwrite" });
    } else {
      vscode.postMessage({
        command: "save",
        old: color,
        color: inputValue,
        // name: "",
      });
    }
  };

  const handleAcceptColorMerge = (isAccepted: boolean) => {
    if (isAccepted) {
      vscode.postMessage({
        command: "save",
        old: color,
        color: inputValue,
        // name: "",
      });
    }
    setModalStatus({ status: false, type: "" });
  };

  const handleAcceptModalReset = (isAccepted: boolean) => {
    if (isAccepted) {
      vscode.postMessage({
        command: "reset",
        color: inputValue,
      });
    }
    setModalStatus({ status: false, type: "" });
  };

  const handleAcceptModalName = (isAccepted: boolean) => {
    if (isAccepted && colorNameRef.current) {
      vscode.postMessage({
        command: "colorName",
        color: inputValue,
        name: colorNameRef.current?.value,
      });
    }
    setModalStatus({ status: false, type: "" });
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
    setModalStatus({ status: true, type: "reset" });
  };

  const handleColorName = () => {
    setModalStatus({ status: true, type: "name" });
  };

  const handlePin = () => {
    vscode.postMessage({
      command: "togglePin",
      color: inputValue,
    });
  };

  const onResetColorPickerModal = () => {
    setInputValue(color);
  };

  return (
    <div className={styles.content}>
      <div className={styles.form}>
        <label htmlFor="colopicker" className={styles.colorLabel}>
          {translations["choose a new color"]}
          {/* {translations["choose a new color"]} -- {inputValue} */}
        </label>
        <ColorBox value={inputValue} setValue={(e) => setInputValue(e)} />
        <div className={styles.colorContainer}>
          <section className={styles.brightness}>
            <i className="codicon codicon-lightbulb"></i>
            <div>
              <ActionButton
                caption={translations["less brightness"]}
                direction="bottom"
                icon="chrome-minimize"
                onClick={() => handleBrightness(false)}
              />
              <ActionButton
                caption={translations["more brightness"]}
                direction="bottom"
                icon="add"
                onClick={() => handleBrightness(true)}
              />
            </div>
          </section>
          <ColorPickerModal
            color={color}
            onColorSelected={(colorSelected) => setInputValue(colorSelected)}
          />
          <ActionButton
            caption={translations["reload color"]}
            direction="bottom"
            icon="refresh"
            onClick={onResetColorPickerModal}
          />
          <ActionButton
            caption={translations["set name"]}
            direction="bottom"
            icon="comment"
            onClick={handleColorName}
          />
          <ActionButton
            caption={translations["pin/unpin"]}
            direction="bottom"
            icon="pinned"
            onClick={handlePin}
          />
        </div>
        <div className={styles.btnContainer}>
          <button
            className="vscode-button secondary block"
            onClick={handleSave}
            disabled={color === inputValue}
          >
            <span className="vscode-button__text">{translations["Save"]}</span>
          </button>
          <button
            className="vscode-button block"
            onClick={handleReset}
            disabled={!hasCustomizations}
          >
            <span className="vscode-button__text">{translations["Reset"]}</span>
          </button>
        </div>
        {modalStatus.status && (
          <>
            {modalStatus.type === "reset" && (
              <Modal
                onAccept={handleAcceptModalReset}
                message={
                  translations[
                    "Are you sure you want to reset this color?, it will revert to the default theme value and remove its custom names and color pin in case it exists."
                  ]
                }
              />
            )}
            {modalStatus.type === "overwrite" && (
              <Modal
                onAccept={handleAcceptColorMerge}
                message={
                  translations[
                    "This color already exists, it will merge two colors into one. Do you want to continue?"
                  ]
                }
              />
            )}
            {modalStatus.type === "name" && (
              <Modal
                onAccept={handleAcceptModalName}
                message={translations["set name"]}
              >
                <>
                  <hr className="vscode-divider" />
                  <input
                    type="text"
                    name="colorname"
                    autoFocus
                    placeholder={translations["set name"]}
                    ref={colorNameRef}
                  />
                </>
              </Modal>
            )}
          </>
        )}
      </div>

      <div className={styles.typesContainer}>
        <TypeList
          color={color}
          list={colorsMap[color]}
          link="https://code.visualstudio.com/api/references/theme-color"
          title={translations["Colors"]}
        />
        {tokenColorsMap[color] && (
          <TypeList
            color={color}
            list={tokenColorsMap[color].scope}
            link="https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide"
            title={translations["TextMate Token Colors"]}
          />
        )}
        <TypeList
          color={color}
          list={syntaxMap[color]}
          link="https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide"
          title={translations["Syntax Colors"]}
        />
        <TypeList
          color={color}
          list={semanticTokenColorMap[color]}
          link="https://code.visualstudio.com/docs/configure/themes#_editor-semantic-highlighting"
          title={translations["Semantic Token Colors"]}
        />
      </div>
    </div>
  );
};

export default AccordionContent;
