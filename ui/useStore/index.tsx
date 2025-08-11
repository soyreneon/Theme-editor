import React, {
  createContext,
  // Dispatch,
  // SetStateAction,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { type ColorMap } from "../../types";
import captions from "../language";

type CaptionKeys = (typeof captions)[number];
interface StoreContextType {
  // language: string;
  title: string | null;
  colors: string[];
  colorMap: ColorMap;
  customColorList: string[];
  translations: Record<CaptionKeys, string>;
  // setTranslation: Dispatch<SetStateAction<StoreContextType>>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
export const vscode = acquireVsCodeApi();

const initialState: StoreContextType = {
  // const initialState: Omit<StoreContextType, "setTranslation"> = {
  title: null,
  colors: [],
  // language: "",
  colorMap: { colorsMap: {}, tokenColorsMap: {}, syntaxMap: {} },
  customColorList: [],
  translations: captions.reduce(
    (acc, caption) => ({ ...acc, [caption]: caption }),
    {} as Record<CaptionKeys, string>
  ),
};

export const StoreProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const [state, setState] = useState<StoreContextType>(initialState);

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "themeChanged") {
        // console.log("theme!!!", message);
        setState((prev) => ({
          ...prev,
          title: message.theme,
          colors: message.colors,
          colorMap: message.colormaps,
          customColorList: message.customColorList,
        }));
      }
      if (message.type === "language") {
        console.log("lang!!!", message.translations);
        setState((prev) => ({
          ...prev,
          // language: message.language,
          translations: message.translations,
        }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <StoreContext.Provider value={state}>{children}</StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a ThemeProvider");
  }
  return context;
};
