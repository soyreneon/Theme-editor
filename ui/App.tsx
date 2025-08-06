import "@vscode-elements/elements-lite/components/divider/divider.css";
import "@vscode-elements/elements-lite/components/button/button.css";
import "@vscode-elements/elements-lite/components/action-button/action-button.css";
import "@vscode-elements/elements-lite/components/badge/badge.css";
import "@vscode-elements/elements-lite/components/collapsible/collapsible.css";
import "./App.css";
import { useTheme } from "./useStore";
import Accordion from "./components/Accordion";
import Header from "./components/Header";

export function App() {
  const theme = useTheme();
  const { title, colors, colorMap, customColorList } = theme;

  return (
    <>
      <Header title={title} />
      {colors.map((color) => (
        <Accordion
          color={color}
          colormaps={colorMap}
          key={color}
          customColorList={customColorList}
        />
      ))}
      <hr className="vscode-divider" />
    </>
  );
}
