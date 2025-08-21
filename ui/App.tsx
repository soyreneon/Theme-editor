import "@vscode-elements/elements-lite/components/divider/divider.css";
import "@vscode-elements/elements-lite/components/button/button.css";
import "@vscode-elements/elements-lite/components/action-button/action-button.css";
import "@vscode-elements/elements-lite/components/badge/badge.css";
import "@vscode-elements/elements-lite/components/collapsible/collapsible.css";
import "./App.css";
import { useEffect, useState } from "react";
import { useStore, vscode } from "./useStore";
import captions from "./language";
import Accordion from "./components/Accordion";
import Loader from "./components/Loader";
import Header from "./components/Header";

export function App() {
  const store = useStore();
  const [list, setList] = useState<string[]>([]);
  const { title, colors, colorMap, customColorList, loading, tunerSettings } =
    store;

  useEffect(() => {
    // call vscode api when ui is ready
    vscode.postMessage({
      command: "ui-ready",
      captions,
    });
  }, []);

  useEffect(() => {
    const settings = Object.keys(tunerSettings);
    const newList = colors.filter((color) => !tunerSettings?.[color]?.pinned);
    settings.map((setting) => {
      if (tunerSettings?.[setting]?.pinned) {
        newList.unshift(setting);
      }
    });
    setList(newList);
  }, [tunerSettings]);

  if (loading) {
    return <Loader />;
  }

  return (
    <>
      <Header title={title} count={colors.length} />
      {list.map((color) => (
        <Accordion
          color={color}
          colormaps={colorMap}
          key={color}
          customColorList={customColorList}
          settings={tunerSettings}
        />
      ))}
      <hr className="vscode-divider" />
    </>
  );
}
