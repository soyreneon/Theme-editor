import { useState, useEffect, type FC } from "react";
import Modal from "../Modal";
import ColorBox from "../ColorBox";
import Checkbox from "../Checkbox";
import { vscode, useStore } from "../../useStore";
import styles from "./addproperty.module.css";
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
  const [templateIndex, setTemplateIndex] = useState<number>(1);
  const [templateState, setTemplateState] = useState<TemplateState>({});
  const [templateAlpha, setTemplateAlpha] = useState<number>(0);

  const currentTemplate = templateList[templateIndex - 1];

  // Initialize template state once on component mount
  useEffect(() => {
    initializeTemplateState(templateIndex);
  }, [templateIndex, themeType]);

  // Initialize template state when template changes
  const initializeTemplateState = (index: number) => {
    const template = templateList[index - 1];
    const newState: TemplateState = {};

    template.colors.forEach((colorGroup) => {
      const defaultColor =
        themeType === "dark" ? colorGroup.defaultDark : colorGroup.defaultLight;
      const key = colorGroup.name;

      // If optional, start as disabled; otherwise enabled
      newState[key] = {
        enabled: !colorGroup.optional,
        color: defaultColor,
      };
    });

    setTemplateState(newState);
    // Set template-level alpha
    setTemplateAlpha((template.colors[0] as any)?.alpha || 0);
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

      let finalColor = state.color;

      // Add alpha to properties marked as transparent (using template-level alpha)
      colorGroup.properties.forEach((prop) => {
        if ((prop as any).isTransparent && templateAlpha > 0) {
          const alphaHex = Math.round((templateAlpha / 100) * 255)
            .toString(16)
            .padStart(2, "0")
            .toUpperCase();
          finalColor = `${state.color}${alphaHex}`;
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

    console.log(propertyListByType);
    return;
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

  return (
    <Modal
      isFullWidth
      onAccept={handleModalAction}
      hasCancel={true}
      message={translations["Color templates"]}
      acceptText={translations["Apply"]}
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
              {templateList.map((template) => (
                <option key={template.index} value={template.index}>
                  {template.title}
                </option>
              ))}
            </select>
            <i className="chevron-icon codicon codicon-chevron-down icon-arrow" />
          </div>
        </div>
        {/* Template-level alpha control */}
        {(currentTemplate.colors[0] as any)?.alpha !== undefined && (
          <div className={styles.alphaContainer} style={{ marginTop: "16px" }}>
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
                <h2 className="title">{colorGroup.name}</h2>
              </summary>

              <div style={{ padding: "12px 0" }}>
                {colorGroup.optional && state && (
                  <Checkbox
                    id={`templateColor-${templateIndex}-${colorGroup.name}`}
                    title={translations["This color change is also applied to"]}
                    onToggleChecked={(isChecked) => {
                      handleOptionalToggle(colorGroup.name, isChecked);
                    }}
                  />
                )}

                {state && state.enabled && (
                  <ColorBox
                    value={state.color}
                    setValue={(newColor) =>
                      handleColorChange(colorGroup.name, newColor)
                    }
                    hasColorPalette
                  />
                )}
              </div>
            </details>
          );
        })}
      </div>
    </Modal>
  );
};

export default ColorTemplateModal;
