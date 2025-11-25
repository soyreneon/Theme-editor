import { type Filter } from "../../../types";
type TemplateColor = {
  type: Exclude<Filter, "all">;
  name: string;
  properties: PropertyColor[];
  optional?: boolean;
  defaultDark: string;
  defaultLight: string;
};

type PropertyColor = {
  name: string;
  isTransparent?: boolean;
};
type Template = {
  index: number; // ?
  title: string;
  colors: TemplateColor[];
  alpha?: number;
};

const templateList: Template[] = [
  {
    index: 1,
    title: "Solid editor color", // add translation
    colors: [
      {
        type: "colors",
        name: "overall background",
        properties: [
          { name: "activityBar.background" },
          { name: "editor.background" },
          { name: "panel.background" },
          { name: "tab.activeBackground" },
        ],
        optional: true,
        defaultDark: "#003333",
        defaultLight: "#ffeedd",
      },
    ],
  },
  {
    index: 2,
    title: "Solid editor color(variant)",
    alpha: 80,
    colors: [
      {
        type: "colors",
        name: "overall background",
        properties: [
          { name: "activityBar.background" },
          { name: "editor.background" },
          { name: "panel.background" },
          { name: "editor.hoverHighlightBackground", isTransparent: true },
        ],
        defaultDark: "#440044",
        defaultLight: "#ffeedd",
      },
      {
        type: "tokenColors",
        name: "strings",
        properties: [{ name: "string.regexp" }],
        defaultDark: "#e0e01b",
        defaultLight: "#6f3800",
      },
    ],
  },
];

export default templateList;
