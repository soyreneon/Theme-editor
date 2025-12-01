import { type Template } from "./index";

const activityBar: Template = {
  title: "ActivityBar",
  colors: [
    {
      type: "colors",
      name: "background",
      properties: [
        { name: "activityBar.background" },
        { name: "activityBarBadge.foreground" },
      ],
      optional: true,
      defaultDark: "#222228",
      defaultLight: "#eaeae9",
    },
    {
      type: "colors",
      name: "contrast",
      properties: [
        { name: "activityBar.activeBorder" },
        { name: "activityBarBadge.background" },
      ],
      optional: true,
      defaultDark: "#18c1c4",
      defaultLight: "#0058a0",
    },
    {
      type: "colors",
      name: "active",
      properties: [{ name: "activityBar.foreground" }],
      optional: true,
      defaultDark: "#8fc3f0",
      defaultLight: "#1d1971",
    },
    {
      type: "colors",
      name: "inactive",
      properties: [{ name: "activityBar.inactiveForeground" }],
      optional: true,
      defaultDark: "#384864",
      defaultLight: "#8c8b91",
    },
    {
      type: "colors",
      name: "border",
      properties: [{ name: "activityBar.border" }],
      optional: true,
      defaultDark: "#333333",
      defaultLight: "#6b6a71",
    },
  ],
};

export default activityBar;
