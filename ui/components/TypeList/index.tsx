import { type FC, useState, useRef, useEffect } from "react";
import chroma from "chroma-js";
import { useDebounce } from "../../hooks/useDebounce";
import styles from "./typelist.module.css";
import { useStore, vscode } from "../../useStore";
import { type Filter, type Group } from "../../../types";
import ColorBox from "../ColorBox";
import Modal from "../Modal";
import Checkbox from "../Checkbox";
import TextMatch from "../TextMatch";

interface TypeListProps {
  color: string;
  list: string[];
  title: string;
  link: string;
  type: Filter;
  onToggleChecked?: (value: boolean) => void;
}

const applyTo: Group = {
  colors: false,
  tokenColors: false,
  syntax: false,
  semanticTokenColors: false,
};

const TypeList: FC<TypeListProps> = ({
  color,
  list,
  title,
  link,
  type,
  onToggleChecked,
}) => {
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>(color);
  const store = useStore();
  const propertyName = useRef<string>("");
  const {
    translations,
    filter,
    alphaColors,
    searchString,
    setLastColorChanged,
    setLoading,
  } = store;
  const debouncedSearch = useDebounce<string>(searchString, 1500);
  const checkId = `add-${color.slice(1)}-${title.replace(/\s+/g, "")}`;
  const propsList = list?.sort();

  const onHandleClick = (property: string) => {
    setIsModalOpen(true);
    propertyName.current = property;
  };

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

  if (type !== filter && filter !== "all") return null;
  return (
    list && (
      <div className={styles.typeContainer} style={{ borderLeftColor: color }}>
        <div className={styles.header}>
          {filter === "all" ? (
            <Checkbox
              id={checkId}
              title={`${title} (${list.length})`}
              onToggleChecked={onToggleChecked}
            />
          ) : (
            <span className="text">
              <h4>
                {title} ({list.length})
              </h4>
            </span>
          )}

          <a href={link}>
            <span>{translations["Learn more"]}</span>
            <i className="codicon codicon-arrow-small-right"></i>
          </a>
        </div>
        <ul>
          {propsList.map((prop) => (
            <li key={prop}>
              <i className={`codicon codicon-dash ${styles.dash}`} />
              <i className={`codicon codicon-edit ${styles.pencil}`} />
              {getAlphaProp(prop) && (
                <i className={`codicon codicon-eye ${styles.eye}`} />
              )}

              <a onClick={() => onHandleClick(prop)}>
                <TextMatch text={prop} match={debouncedSearch} />
              </a>
            </li>
          ))}
        </ul>
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
    )
  );
};

export default TypeList;
