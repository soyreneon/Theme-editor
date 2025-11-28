import { type Template } from "./index";

const brackets: Template = {
  // index: 3,
  title: "Bracket colors",
  colors: [
    {
      type: "colors",
      name: "Level 1",
      properties: [{ name: "editorBracketHighlight.foreground1" }],
      defaultDark: "#79c0ff",
      defaultLight: "#0a69da",
    },
    {
      type: "colors",
      name: "Level 2",
      properties: [{ name: "editorBracketHighlight.foreground2" }],
      defaultDark: "#56d364",
      defaultLight: "#1a7f37",
    },
    {
      type: "colors",
      name: "Level 3",
      properties: [{ name: "editorBracketHighlight.foreground3" }],
      defaultDark: "#e3b341",
      defaultLight: "#9a6700",
    },
    {
      type: "colors",
      name: "Level 4",
      properties: [{ name: "editorBracketHighlight.foreground4" }],
      defaultDark: "#ffa198",
      defaultLight: "#cf222e",
    },
    {
      type: "colors",
      name: "Level 5",
      properties: [{ name: "editorBracketHighlight.foreground5" }],
      defaultDark: "#ff9bce",
      defaultLight: "#bf3989",
    },
    {
      type: "colors",
      name: "Level 6",
      properties: [{ name: "editorBracketHighlight.foreground6" }],
      defaultDark: "#d2a8ff",
      defaultLight: "#8250df",
    },
  ],
};

export default brackets;
