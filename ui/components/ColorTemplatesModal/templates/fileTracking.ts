import { type Template } from "./index";

const change: Template = {
  title: "File tracking",
  colors: [
    {
      type: "colors",
      name: "default",
      properties: [{ name: "sideBar.foreground" }],
      optional: true,
      defaultDark: "#aaaaaa",
      defaultLight: "#222222",
    },
    {
      type: "colors",
      name: "untracked",
      properties: [{ name: "gitDecoration.untrackedResourceForeground" }],
      optional: true,
      defaultDark: "#00cd65",
      defaultLight: "#048410",
    },
    {
      type: "colors",
      name: "warning",
      properties: [{ name: "list.warningForeground" }],
      optional: true,
      defaultDark: "#f29140",
      defaultLight: "#9e581e",
    },
    {
      type: "colors",
      name: "modified",
      properties: [{ name: "gitDecoration.modifiedResourceForeground" }],
      optional: true,
      defaultDark: "#f9fa92",
      defaultLight: "#c4ad04",
    },
    {
      type: "colors",
      name: "error",
      properties: [{ name: "list.errorForeground" }],
      optional: true,
      defaultDark: "#ff5c71",
      defaultLight: "#a4071c",
    },
    {
      type: "colors",
      name: "ignored",
      properties: [{ name: "gitDecoration.ignoredResourceForeground" }],
      optional: true,
      defaultDark: "#555560",
      defaultLight: "#b8b8bd",
    },
  ],
};

export default change;
