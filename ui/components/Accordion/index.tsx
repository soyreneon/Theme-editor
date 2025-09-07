import { type FC } from "react";
import { type ColorMap, type TunerSettings } from "../../../types";
import AccordionContent from "./AccordionContent";
import styles from "./accordion.module.css";

interface AccordionProps {
  color: string;
  colormaps: ColorMap;
  customColorList: string[];
  settings: TunerSettings;
}

const Accordion: FC<AccordionProps> = ({
  color,
  colormaps,
  customColorList,
  settings,
}) => {
  const getColorLength = (arr: any[]) => (arr ?? []).length;

  const count =
    getColorLength(colormaps.colorsMap[color]) +
    getColorLength(colormaps.tokenColorsMap[color]?.scope) +
    getColorLength(colormaps.syntaxMap[color]) +
    getColorLength(colormaps.semanticTokenColorMap[color]);
  const hasCustomizations = customColorList.includes(color);

  return (
    <details className="vscode-collapsible">
      <summary>
        <i className="codicon codicon-chevron-right icon-arrow"></i>
        <h2 className="title">
          <span
            className={styles.colorPreview}
            style={{ backgroundColor: color }}
          />
          {settings?.[color]?.pinned ? (
            <span className={styles.pinned}>
              <i className="codicon codicon-pin"></i>
              &nbsp; &nbsp; &nbsp;
            </span>
          ) : null}
          <span className={styles.colorheader}>
            {color}
            {settings?.[color]?.name && (
              <span> ({settings?.[color]?.name})</span>
            )}
            {hasCustomizations ? " * " : " "}
            {/* {getColorLength(colormaps.semanticTokenColorMap[color]) || " "} */}
          </span>
        </h2>
        <div className={styles.badgeContainer}>
          <span className="vscode-badge activity-bar-counter">{count}</span>
        </div>
      </summary>
      <div>
        <AccordionContent
          color={color}
          colormaps={colormaps}
          hasCustomizations={hasCustomizations}
          // name={settings[color]?.name}
        />
      </div>
    </details>
  );
};

export default Accordion;
