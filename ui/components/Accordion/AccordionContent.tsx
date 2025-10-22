import { useEffect, useState, useRef, type FC } from "react";
import { type ColorMap, type Group } from "../../../types";
import { hexToRgb, rgbToHex } from "../../utils";
import { vscode, useStore } from "../../useStore";
import TypeList from "../TypeList";
import ActionButton from "../ActionButton";
import Checkbox from "../Checkbox";
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
  const {
    translations,
    colorOrders,
    filter,
    setLastColorChanged,
    setLoading,
    tunerSettings,
  } = store;
  const { colorsMap, tokenColorsMap, syntaxMap, semanticTokenColorsMap } =
    colormaps;
  const [inputValue, setInputValue] = useState(color);
  const [oneGroupSelectionRule, setOneGroupSelectionRule] =
    useState<boolean>(true);
  const initialGroup: Group = {
    colors: colorsMap[color]?.length > 0,
    tokenColors: tokenColorsMap[color]?.scope?.length > 0,
    syntax: syntaxMap[color]?.length > 0,
    semanticTokenColors: semanticTokenColorsMap[color]?.length > 0,
  };
  const [colorGroup, setColorGroup] = useState<Group>(initialGroup);
  const colorNameRef = useRef<HTMLInputElement>(null);
  const [modalStatus, setModalStatus] = useState<{
    status: boolean;
    type: string;
  }>({ status: false, type: "" });

  // check if at least one element is checked
  useEffect(() => {
    if (
      modalStatus.type === "name" &&
      tunerSettings[color]?.name &&
      colorNameRef.current
    ) {
      colorNameRef.current.value = tunerSettings[color]?.name;
    }
  }, [modalStatus]);

  // check if at least one element is checked
  useEffect(() => {
    const rule = !Object.keys(colorGroup).find(
      (group) => colorGroup[group as keyof Group]
    );
    setOneGroupSelectionRule(rule);
  }, [colorGroup]);

  // verify that colors are applied only to filtered data
  // ? when 2 colors get merged, the obj is overritten
  useEffect(() => {
    setColorGroup(initialGroup);
  }, [filter, colorOrders.all.length]);

  const getColorGroups = (): string[] =>
    Object.keys(initialGroup).filter(
      (group) => group !== filter && initialGroup[group as keyof Group]
    );

  const getFullChange = (): boolean =>
    !Object.keys(initialGroup).find(
      (group) =>
        initialGroup[group as keyof Group] !== colorGroup[group as keyof Group]
    );

  const handleSave = () => {
    if (color === inputValue) return;
    // check if color already exists
    if (colorOrders.all.includes(inputValue)) {
      setModalStatus({ status: true, type: "overwrite" });
    } else {
      setLoading(true);
      vscode.postMessage({
        command: "save",
        old: color,
        color: inputValue,
        isFullChange: getFullChange(),
        applyTo: colorGroup,
      });
      setLastColorChanged(inputValue);
    }
  };

  const handleAcceptColorMerge = (isAccepted: boolean) => {
    if (isAccepted) {
      setLoading(true);
      vscode.postMessage({
        command: "save",
        old: color,
        color: inputValue,
        isFullChange: getFullChange(),
        applyTo: colorGroup,
      });
      setLastColorChanged(inputValue);
    }
    setModalStatus({ status: false, type: "" });
  };

  const handleAcceptModalReset = (isAccepted: boolean) => {
    if (isAccepted) {
      setLoading(true);
      vscode.postMessage({
        command: "reset",
        color: inputValue,
        applyTo: colorGroup,
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
    setLastColorChanged(color);
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
        {oneGroupSelectionRule && (
          <div className={styles.alert}>
            {translations["Select at least one group to apply this changes"]}
          </div>
        )}

        {filter !== "all" && getColorGroups().length ? (
          <div className={styles.btnContainer}>
            <Checkbox
              id={`${color}-applyothers`}
              title={`${
                translations["This color change is also applied to"]
              } ${getColorGroups().join(" " + translations["and"] + " ")}`}
              onToggleChecked={(isChecked) => {
                if (isChecked) {
                  setColorGroup(initialGroup);
                } else {
                  // only to this group
                  setColorGroup((prev) => {
                    const newGroup: Group = {
                      colors: false,
                      tokenColors: false,
                      syntax: false,
                      semanticTokenColors: false,
                    };
                    Object.keys(prev).map(
                      (key) => (newGroup[key as keyof Group] = key === filter)
                    );
                    return newGroup;
                  });
                }
              }}
            />
          </div>
        ) : null}

        <div className={styles.btnContainer}>
          <button
            className="vscode-button block"
            onClick={handleSave}
            disabled={color === inputValue || oneGroupSelectionRule}
          >
            <span className="vscode-button__text">{translations["Apply"]}</span>
          </button>
          <button
            className="vscode-button secondary block"
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
                    "Are you sure you want to reset this color?, it will revert to the default theme value and remove its custom name and color pin in case it exists."
                  ]
                }
              />
            )}
            {modalStatus.type === "overwrite" && (
              <Modal
                onAccept={handleAcceptColorMerge}
                message={
                  translations[
                    "This color already exists, it could merge two colors into one depending on the checked groups. Do you want to continue?"
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
          title={translations["Workbench Colors"]}
          onToggleChecked={(isChecked) => {
            setColorGroup((prev) => ({ ...prev, colors: isChecked }));
          }}
          type="colors"
        />
        {tokenColorsMap[color] && (
          <TypeList
            color={color}
            list={tokenColorsMap[color].scope}
            link="https://code.visualstudio.com/api/language-extensions/semantic-highlight-guide"
            title={translations["TextMate Token Colors"]}
            onToggleChecked={(isChecked) => {
              setColorGroup((prev) => ({ ...prev, tokenColors: isChecked }));
            }}
            type="tokenColors"
          />
        )}
        <TypeList
          color={color}
          list={syntaxMap[color]}
          link="https://code.visualstudio.com/api/language-extensions/syntax-highlight-guide"
          title={translations["Syntax Colors"]}
          onToggleChecked={(isChecked) => {
            setColorGroup((prev) => ({ ...prev, syntax: isChecked }));
          }}
          type="syntax"
        />
        <TypeList
          color={color}
          list={semanticTokenColorsMap[color]}
          link="https://code.visualstudio.com/docs/configure/themes#_editor-semantic-highlighting"
          title={translations["Semantic Token Colors"]}
          onToggleChecked={(isChecked) => {
            setColorGroup((prev) => ({
              ...prev,
              semanticTokenColors: isChecked,
            }));
          }}
          type="semanticTokenColors"
        />
      </div>
    </div>
  );
};

export default AccordionContent;
