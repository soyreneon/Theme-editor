import React, { createContext, useContext, useState, ReactNode } from "react";
import { type ColorMap } from "../../types";

interface ThemeContextType {
  title: string | null;
  colors: string[];
  colorMap: ColorMap;
  customColorList: string[];
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);
export const vscode = acquireVsCodeApi();

const initialState: ThemeContextType = {
  title: null,
  colors: [],
  colorMap: { colorsMap: {}, tokenColorsMap: {}, syntaxMap: {} },
  customColorList: [],
};

let globalState = initialState;
let setGlobalState: React.Dispatch<
  React.SetStateAction<ThemeContextType>
> | null = null;

const handleMessage = (event: MessageEvent) => {
  const message = event.data;

  if (message.type === "themeChanged") {
    globalState = {
      title: message.theme,
      colors: message.colors,
      colorMap: message.colormaps,
      customColorList: message.customColorList,
    };

    if (setGlobalState) {
      setGlobalState(globalState);
    }
  }
};

// Add the event listener once when the module is loaded
if (typeof window !== "undefined") {
  window.addEventListener("message", handleMessage);
}

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<ThemeContextType>(globalState);

  // Sync the global state setter
  setGlobalState = setState;

  return (
    <ThemeContext.Provider value={state}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
};
