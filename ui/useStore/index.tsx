import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import { type ColorMap } from "../../types";
import captions from "../language";

type CaptionKeys = (typeof captions)[number];
interface StoreContextType {
  title: string | null;
  colors: string[];
  loading: boolean;
  colorMap: ColorMap;
  customColorList: string[];
  translations: Record<CaptionKeys, string>;
  setLoading: (loading: boolean) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
export const vscode = acquireVsCodeApi();

const initialState = {
  title: null,
  colors: [],
  loading: true,
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
  const [state, setState] = useState(initialState);

  // Add setLoading function
  const setLoading = (loading: boolean) => {
    // setTimeout(() => {
    setState((prev) => ({
      ...prev,
      loading,
    }));
    // }, 500);
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "themeChanged") {
        setState((prev) => ({
          ...prev,
          title: message.theme,
          colors: message.colors,
          colorMap: message.colormaps,
          customColorList: message.customColorList,
          loading: false,
        }));
      }
      if (message.type === "language") {
        setState((prev) => ({
          ...prev,
          translations: message.translations,
        }));
      }
      if (message.type === "refresh") {
        setState((prev) => ({
          ...prev,
          loading: message.loading,
        }));
      }
    };

    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, []);

  return (
    <StoreContext.Provider value={{ ...state, setLoading }}>
      {children}
    </StoreContext.Provider>
  );
};

export const useStore = (): StoreContextType => {
  const context = useContext(StoreContext);
  if (!context) {
    throw new Error("useStore must be used within a ThemeProvider");
  }
  return context;
};
