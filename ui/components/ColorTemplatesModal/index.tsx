import { useState, useEffect, type FC } from "react";
import Modal from "../Modal";
import ColorBox from "../ColorBox";
import Checkbox from "../Checkbox";
import { vscode, useStore } from "../../useStore";
import styles from "./colortemplates.module.css";
import templateList from "./templates";

interface ColorTemplateModalProps {
  onAccept: (isAccepted: boolean) => void;
}

interface PropertyColor {
  property: string;
  color: string;
}

interface TemplateState {
  [key: string]: {
    enabled: boolean;
    color: string;
  };
}

const ColorTemplateModal: FC<ColorTemplateModalProps> = ({ onAccept }) => {
  const store = useStore();
  const { translations, themeType } = store;
  const [isDarkTemplate, setIsDarkTemplate] = useState<boolean>(
    themeType === "dark"
  );
  const [templateIndex, setTemplateIndex] = useState<number>(1);
  const [templateState, setTemplateState] = useState<TemplateState>({});
  const [templateAlpha, setTemplateAlpha] = useState<number>(0);

  const currentTemplate = templateList[templateIndex - 1];

  // Initialize template state once on component mount
  useEffect(() => {
    initializeTemplateState(templateIndex);
  }, [templateIndex, isDarkTemplate]);

  // Initialize template state when template changes
  const initializeTemplateState = (index: number) => {
    const template = templateList[index - 1];
    const newState: TemplateState = {};

    template.colors.forEach((colorGroup) => {
      const defaultColor = isDarkTemplate
        ? colorGroup.defaultDark
        : colorGroup.defaultLight;
      const key = colorGroup.name;

      // If optional, start as disabled; otherwise enabled
      newState[key] = {
        enabled: colorGroup?.optional || true,
        color: defaultColor,
      };
    });

    setTemplateState(newState);
    setTemplateAlpha(template.alpha || 0);
  };

  const handleTemplateChange = (index: number) => {
    setTemplateIndex(index);
    initializeTemplateState(index);
  };

  const handleColorChange = (colorGroupName: string, newColor: string) => {
    setTemplateState((prev) => ({
      ...prev,
      [colorGroupName]: {
        ...prev[colorGroupName],
        color: newColor,
      },
    }));
  };

  const handleOptionalToggle = (colorGroupName: string, isEnabled: boolean) => {
    setTemplateState((prev) => ({
      ...prev,
      [colorGroupName]: {
        ...prev[colorGroupName],
        enabled: isEnabled,
      },
    }));
  };

  const buildPropertyListByType = () => {
    const propertyListByType = {
      colors: [] as PropertyColor[],
      tokenColors: [] as PropertyColor[],
      syntax: [] as PropertyColor[],
      semanticTokenColors: [] as PropertyColor[],
    };

    currentTemplate.colors.forEach((colorGroup) => {
      const state = templateState[colorGroup.name];

      if (!state || !state.enabled) {
        return;
      }

      // Add alpha to properties marked as transparent
      colorGroup.properties.forEach((prop) => {
        let finalColor = state.color;
        if ((prop as any).isTransparent && templateAlpha > 0) {
          const alphaHex = Math.round((templateAlpha / 100) * 255)
            .toString(16)
            .padStart(2, "0");
          finalColor = `${state.color}${alphaHex}`.toLowerCase();
        }

        propertyListByType[colorGroup.type].push({
          property: prop.name,
          color: finalColor,
        });
      });
    });

    return propertyListByType;
  };

  const handleAccept = () => {
    const propertyListByType = buildPropertyListByType();

    vscode.postMessage({
      command: "templateColor",
      properties: propertyListByType,
    });
    onAccept(true);
  };

  const handleCancel = () => {
    onAccept(false);
  };

  const handleModalAction = (isAccepted: boolean) => {
    if (isAccepted) {
      handleAccept();
    } else {
      handleCancel();
    }
  };

  const isApplyEnabled = (): boolean => {
    return !!Object.keys(templateState).find(
      (color) => templateState[color]?.enabled
    );
  };

  return (
    <Modal
      isFullWidth
      onAccept={handleModalAction}
      message={translations["Color templates"]}
      acceptText={translations["Apply"]}
      isApplyEnabled={isApplyEnabled()}
    >
      <div className={styles.parent}>
        <div className={styles.body}>
          <label className={styles.header}>{translations["Template"]}</label>
          <div className={`${styles.select} vscode-select`}>
            <select
              value={templateIndex}
              onChange={(e) => {
                handleTemplateChange(parseInt(e.target.value));
              }}
            >
              // ! review ok fine
              {templateList.map((template, i) => (
                <option key={1 + 1} value={i + 1}>
                  {template.title}
                </option>
              ))}
            </select>
            <i className="chevron-icon codicon codicon-chevron-down icon-arrow" />
          </div>
        </div>
        {!themeType && (
          <Checkbox
            id="switchColors"
            title={translations["Switch colors"]}
            isDefaultChecked={isDarkTemplate}
            onToggleChecked={setIsDarkTemplate}
          />
        )}
        {currentTemplate?.alpha !== undefined && (
          <div className={styles.alphaContainer}>
            <label className={styles.alphaLabel}>
              {translations["Alpha"]}: {templateAlpha}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={templateAlpha}
              onChange={(e) => setTemplateAlpha(Number(e.target.value))}
              className={styles.alphaSlider}
            />
          </div>
        )}

        <div>
          {currentTemplate.colors?.map((colorGroup) => {
            const state = templateState[colorGroup.name];

            return (
              <details
                key={colorGroup.name}
                className="vscode-collapsible"
                name="accordion-template"
              >
                <summary>
                  <i className="codicon codicon-chevron-right icon-arrow" />
                  <h2 className={`title ${styles.colorTitle}`}>
                    <span
                      className={styles.colorPreview}
                      style={{
                        backgroundColor: state?.color,
                        opacity: state?.enabled ? 1 : 0.4,
                      }}
                    />
                    {!state?.enabled && (
                      <i
                        className={`codicon codicon-circle-slash ${styles.slash}`}
                      />
                    )}
                    {colorGroup.name}
                  </h2>
                  {colorGroup.optional && (
                    <div className="actions">
                      <button
                        type="button"
                        className="vscode-action-button"
                        title={
                          state?.enabled
                            ? translations["not include color"]
                            : translations["include color"]
                        }
                        onClick={() =>
                          handleOptionalToggle(colorGroup.name, !state?.enabled)
                        }
                      >
                        <i
                          className={`codicon codicon-${
                            state?.enabled ? "eye-closed" : "check"
                          }`}
                          aria-hidden="true"
                        />
                      </button>
                    </div>
                  )}
                </summary>

                <div className={styles.box}>
                  {state?.enabled ? (
                    <ColorBox
                      value={state?.color}
                      setValue={(newColor) =>
                        handleColorChange(colorGroup.name, newColor)
                      }
                      hasColorPalette
                    />
                  ) : (
                    <p>{translations["Not included"]}</p>
                  )}
                </div>
              </details>
            );
          })}
        </div>
      </div>
    </Modal>
  );
};

export default ColorTemplateModal;
