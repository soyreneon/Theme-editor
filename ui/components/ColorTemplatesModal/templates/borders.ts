import { type Template } from "./index";

const borders: Template = {
  // index: 1,
  title: "Borders",
  colors: [
    {
      type: "colors",
      name: "border color",
      properties: [
        { name: "focusBorder" },
        { name: "activityBar.border" },
        { name: "checkbox.border" },
        { name: "dropdown.border" },
        { name: "editorWidget.border" },
        { name: "editorGroup.border" },
        { name: "editorGroupHeader.tabsBorder" },
        { name: "input.border" },
        { name: "notifications.border" },
        { name: "panel.border" },
        { name: "panelInput.border" },
        { name: "pickerGroup.border" },
        { name: "sideBar.border" },
        { name: "sideBarSectionHeader.border" },
        { name: "statusBar.border" },
        { name: "tab.border" },
        { name: "tab.unfocusedActiveBorderTop" },
        { name: "textBlockQuote.border" },
        { name: "titleBar.border" },
      ],
      optional: true,
      defaultDark: "#444c56",
      defaultLight: "#a3b5cbff",
    },
  ],
};

export default borders;
