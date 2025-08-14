import "@vscode-elements/elements-lite/components/divider/divider.css";
import "@vscode-elements/elements-lite/components/button/button.css";
import "@vscode-elements/elements-lite/components/action-button/action-button.css";
import "@vscode-elements/elements-lite/components/badge/badge.css";
import "@vscode-elements/elements-lite/components/collapsible/collapsible.css";
import "./App.css";
import { useEffect } from "react";
import { useStore, vscode } from "./useStore";
import captions from "./language";
import Accordion from "./components/Accordion";
import Loader from "./components/Loader";
import Header from "./components/Header";

export function App() {
  const store = useStore();
  const { title, colors, colorMap, customColorList, loading } = store;

  useEffect(() => {
    // call vscode api when ui is ready
    vscode.postMessage({
      command: "ui-ready",
      captions,
    });
  }, []);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Header title={title} count={colors.length} />
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
