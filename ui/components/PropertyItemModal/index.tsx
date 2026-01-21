import { type FC, useState, useRef } from "react";
import chroma from "chroma-js";
import { useDebounce } from "../../hooks/useDebounce";
import styles from "./propertyitemmodal.module.css";
import { useStore, vscode } from "../../useStore";
import { type Filter, type Group } from "../../../types";
import ColorBox from "../ColorBox";
import Modal from "../Modal";
import TextMatch from "../TextMatch";

interface PropertyItemModalProps {
  prop: string;
  color: string;
  type: Filter;
  hasColorHint?: boolean;
}

const applyTo: Group = {
  colors: false,
  tokenColors: false,
  syntax: false,
  semanticTokenColors: false,
};

const PropertyItemModal: FC<PropertyItemModalProps> = ({
  color,
  prop,
  type,
  hasColorHint = false,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(color);
  const propertyName = useRef<string>("");
  const store = useStore();
  const {
    translations,
    alphaColors,
    searchString,
    setLastColorChanged,
    setLoading,
  } = store;
  const debouncedSearch = useDebounce<string>(searchString, 1500);

  const handleModal = (isAccepted: boolean) => {
    if (isAccepted) {
      setLoading(true);
      setLastColorChanged(chroma(inputValue).hex("rgb"));
      vscode.postMessage({
        command: "singleProp",
        property: propertyName.current,
        color: inputValue,
        oldColor: color,
        applyTo: { ...applyTo, [type]: true },
        // pass total count of properties with this color from parent
      });
    }

    setInputValue(color);
    setIsModalOpen(false);
  };

  const getAlphaProp = (propName: string): string =>
    alphaColors.find((alpha) => Object.keys(alpha)[0] === propName)?.[
      propName
    ] || "";

  const onHandleClick = (property: string) => {
    setIsModalOpen(true);
    propertyName.current = property;
  };

  return (
    <div className={styles.propertyItem}>
      {hasColorHint ? (
        <span
          className={styles.bullet}
          style={{
            backgroundColor: color,
          }}
        />
      ) : (
        <i className={`codicon codicon-dash ${styles.dash}`} />
      )}

      <i className={`codicon codicon-edit ${styles.pencil}`} />
      {getAlphaProp(prop) && (
        <i className={`codicon codicon-eye ${styles.eye}`} />
      )}

      <a onClick={() => onHandleClick(prop)} tabIndex={0}>
        <TextMatch text={prop} match={debouncedSearch} />
      </a>
      {isModalOpen && (
        <Modal
          isFullWidth
          onAccept={handleModal}
          message={`${translations["Individual color change"]}: ${propertyName.current}`}
          isApplyEnabled={inputValue !== color}
        >
          <div>
            <ColorBox
              value={`${inputValue}${getAlphaProp(propertyName.current)}`}
              setValue={setInputValue}
              hasAlpha={type === "colors"}
              hasColorPalette
            />
            {type === "colors" && (
              <p className={styles.message}>
                {
                  translations[
                    "Before changing transparency, review if this color must be transparent or it will obscure content"
                  ]
                }
              </p>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
};

export default PropertyItemModal;
