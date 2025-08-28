import { useState, type FC } from "react";
import { useStore } from "../../useStore";
import Modal from "../Modal";
import Tooltip from "../Tooltip";
import styles from "./colorpicker.module.css";

interface ColorPickerProps {
  color: string;
  onColorSelected: (color: string) => void;
}

const ColorPicker: FC<ColorPickerProps> = ({ color, onColorSelected }) => {
  const store = useStore();
  const { translations, colors } = store;
  const [isModalShown, setIsModalShown] = useState<boolean>(false);
  const [colorSelected, setColorSelected] = useState<string>("");

  const handlePicker = () => {
    setIsModalShown(true);
  };

  const handleModal = (isAccepted: boolean) => {
    if (isAccepted) {
      onColorSelected(colorSelected);
    }
    setIsModalShown(false);
    setColorSelected("");
  };

  const handleColorClick = (selected: string) => {
    setColorSelected((prev) => (prev === selected ? "" : selected));
  };

  return (
    <>
      <Tooltip
        caption={translations["Choose an existing color"]}
        direction="bottom"
        extraPadding={-35}
      >
        <button
          type="button"
          className="vscode-action-button"
          onClick={handlePicker}
        >
          <i className="codicon codicon-symbol-color"></i>
        </button>
      </Tooltip>
      {isModalShown && (
        <Modal onAccept={handleModal} isApplyEnabled={colorSelected !== ""}>
          <div className={styles.colorContainer}>
            {colors
              .filter((current) => current !== color)
              .map((i) => (
                <Tooltip caption={i} direction="bottom">
                  <button
                    key={i}
                    type="button"
                    className={`${styles.colorBtn} ${
                      colorSelected === i ? styles.checked : ""
                    }`}
                    onClick={() => handleColorClick(i)}
                    style={{ backgroundColor: i }}
                  />
                </Tooltip>
              ))}
          </div>
        </Modal>
      )}
    </>
  );
};

export default ColorPicker;
