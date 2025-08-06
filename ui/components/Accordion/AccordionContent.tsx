import { useState, type FC } from "react";
import { type ColorMap } from "../../../types";
import { vscode } from "../../useStore";
import TypeList from "../TypeList";
import Modal from "../Modal";
import styles from "./content.module.css";

interface AccordionContentProps {
  color: string;
  colormaps: ColorMap;
}

const AccordionContent: FC<AccordionContentProps> = ({ color, colormaps }) => {
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

  const handleReset = () => {
    setIsModalShown(true);
  };

  const onResetColorPicker = () => {
    setInputValue(color);
  };

  return (
    <div className={styles.content}>
      <label htmlFor="colopicker" className={styles.colorLabel}>
        Choose a new color:
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
        <button
          type="button"
          className="vscode-action-button"
          onClick={onResetColorPicker}
        >
          <i className="codicon codicon-refresh"></i>
        </button>
      </div>
      <div className={styles.btnContainer}>
        <button className="vscode-button secondary block" onClick={handleSave}>
          <span className="vscode-button__text">Save</span>
        </button>
        <button className="vscode-button block" onClick={handleReset}>
          <span className="vscode-button__text">Reset</span>
        </button>
      </div>
      {isModalShown && (
        <Modal
          onAccept={handleModal}
          message="Are you sure you want to reset this color?, it will revert to the default theme value."
        />
      )}
      <div className={styles.typesContainer}>
        <TypeList
          list={colorsMap[color]}
          link="https://code.visualstudio.com/api/references/theme-color"
          title="Colors"
        />
        {tokenColorsMap[color] && (
          <TypeList
            list={tokenColorsMap[color].scope}
            link="https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide"
            title="Token Colors"
          />
        )}
        <TypeList
          list={syntaxMap[color]}
          link="https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide"
          title="Syntax Colors"
        />
      </div>
    </div>
  );
};

export default AccordionContent;
