import "@vscode-elements/elements-lite/components/divider/divider.css";
import "@vscode-elements/elements-lite/components/button/button.css";
import "@vscode-elements/elements-lite/components/action-button/action-button.css";
import "@vscode-elements/elements-lite/components/badge/badge.css";
import "@vscode-elements/elements-lite/components/collapsible/collapsible.css";
import "./App.css";
import { useTheme } from "./useStore";
import Accordion from "./components/Accordion";

export function App() {
  const theme = useTheme();
  const { title, colors, colorMap } = theme;

  return (
    <>
      <hr className="vscode-divider" />
      <h3>{title}</h3>
      <hr className="vscode-divider" />
      {colors.map((color) => (
        <Accordion color={color} colormaps={colorMap} key={color} />
      ))}
    </>
  );
}
