import { type FC } from "react";
import { colorMap } from "../../../types";
import AccordionContent from "./AccordionContent";
import "./accordion.css";

interface AccordionProps {
  color: string;
  colormaps: colorMap;
}

const Accordion: FC<AccordionProps> = ({ color, colormaps }) => {
  const getColorLength = (arr: any[]) => (arr ?? []).length;

  const count =
    getColorLength(colormaps.colorsMap[color]) +
    getColorLength(colormaps.tokenColorsMap[color]?.scope) +
    getColorLength(colormaps.syntaxMap[color]);

  return (
    <details className="vscode-collapsible">
      <summary>
        <i className="codicon codicon-chevron-right icon-arrow"></i>
        <h2 className="title">
          <span className="color-preview" style={{ backgroundColor: color }} />
          {color}
        </h2>
        <div className="badge-container">
          <span className="vscode-badge activity-bar-counter">{count}</span>
        </div>
      </summary>
      <div>
        <AccordionContent color={color} colormaps={colormaps} />
      </div>
    </details>
  );
};

export default Accordion;
