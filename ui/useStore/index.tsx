import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
} from "react";
import {
  type ColorMap,
  type TunerSettings,
  type Filter,
  type ColorOrders,
  type SimpleColorStructure,
} from "../../types";
import captions from "../language";

type CaptionKeys = (typeof captions)[number];
interface StoreContextType {
  title: string | null;
  colorOrders: ColorOrders;
  // colorOrders: string[];
  loading: boolean;
  colorMap: ColorMap;
  alphaColors: SimpleColorStructure[];
  customColorList: string[];
  tunerSettings: TunerSettings;
  translations: Record<CaptionKeys, string>;
  themeType: string;
  error: string;
  message: string;
  filter: Filter;
  searchString: string;
  lastColorChanged: string;
  setLoading: (loading: boolean) => void;
  setSearchString: (value: string) => void;
  setFilter: (filter: Filter) => void;
  setMessage: (text: string) => void;
  setLastColorChanged: (text: string) => void;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);
export const vscode = acquireVsCodeApi();

const initialState = {
  title: null,
  colorOrders: {
    all: [],
    colors: [],
    tokenColors: [],
    syntax: [],
    semanticTokenColors: [],
  },
  alphaColors: [],
  loading: true,
  colorMap: {
    colorsMap: {},
    tokenColorsMap: {},
    syntaxMap: {},
    semanticTokenColorsMap: {},
  },
  customColorList: [],
  tunerSettings: {},
  translations: captions.reduce(
    (acc, caption) => ({ ...acc, [caption]: caption }),
    {} as Record<CaptionKeys, string>
  ),
  themeType: "",
  error: "",
  message: "",
  lastColorChanged: "",
  searchString: "",
  filter: "all" as Filter,
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

  // Add setFilter function
  const setFilter = (filter: Filter) => {
    setState((prev) => ({
      ...prev,
      filter,
    }));
  };

  // Add setMessage function
  const setMessage = (message: string) => {
    setState((prev) => ({
      ...prev,
      message,
    }));
  };

  // Add setMessage function
  const setSearchString = (searchString: string) => {
    setState((prev) => ({
      ...prev,
      searchString,
    }));
  };

  // Add setLastColorChanged function
  const setLastColorChanged = (lastColorChanged: string) => {
    setState((prev) => ({
      ...prev,
      lastColorChanged,
    }));
  };

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const message = event.data;

      if (message.type === "themeChanged") {
        setState((prev) => ({
          ...prev,
          title: message.theme,
          colorOrders: message.colors,
          colorMap: message.colormaps,
          customColorList: message.customColorList,
          tunerSettings: message.tunerSettings ?? {},
          error: message.error,
          alphaColors: message.alphaColors,
          message: message.message,
          loading: false,
          themeType: message.themeType,
          searchString: prev.title !== message.theme ? "" : prev.searchString,
          filter: prev.title !== message.theme ? "all" : prev.filter,
        }));
      }
      if (message.type === "language") {
        setState((prev) => ({
          ...prev,
          translations: message.translations,
        }));
      }
      if (message.type === "error") {
        setState((_) => ({
          ...initialState,
          loading: false,
          error: message.error,
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
    <StoreContext.Provider
      value={{
        ...state,
        setLoading,
        setSearchString,
        setFilter,
        setMessage,
        setLastColorChanged,
      }}
    >
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
