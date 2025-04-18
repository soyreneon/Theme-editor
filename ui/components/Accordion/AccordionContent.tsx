import { useState, type FC } from "react";
import { colorMap } from "../../../types";
import { vscode } from "../../useStore";
import TypeList from "../TypeList";
import Modal from "../Modal";
import "./content.css";

// const openFullscreenModal = (onConfirm, onCancel) => {};

interface AccordionContentProps {
  color: string;
  colormaps: colorMap;
}

const AccordionContent: FC<AccordionContentProps> = ({ color, colormaps }) => {
  const [inputValue, setInputValue] = useState(color);
  const [isModalShown, setIsModalShown] = useState<boolean>(false);

  const handleSave = () => {
    console.log("Saved color:", inputValue);
    vscode.postMessage({
      command: "save",
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

  return (
    <div className="content">
      <div className="control-container">
        <div className="color-container">
          <input
            type="color"
            value={inputValue}
            className="color-input"
            onChange={(e) => setInputValue(e.target.value)}
          />
          <span className="color-value">{inputValue}</span>
          <button type="button" className="vscode-action-button">
            <i className="codicon codicon-refresh"></i>
          </button>
        </div>
        <div className="btn-container">
          <button className="vscode-button secondary" onClick={handleSave}>
            <span className="vscode-button__text">Save</span>
          </button>
          <button className="vscode-button" onClick={handleReset}>
            <span className="vscode-button__text">Reset</span>
          </button>
        </div>
      </div>
      {isModalShown && <Modal onAccept={handleModal} />}
      <br />
      <TypeList
        list={colormaps.colorsMap[color]}
        link="https://code.visualstudio.com/api/references/theme-color"
        title="Colors"
      />
      {colormaps.tokenColorsMap[color] && (
        <TypeList
          list={colormaps.tokenColorsMap[color].scope}
          link="https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide"
          title="Token Colors"
        />
      )}
      <TypeList
        list={colormaps.syntaxMap[color]}
        link="https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide"
        title="Syntax Colors"
      />
    </div>
  );
};

export default AccordionContent;
