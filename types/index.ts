export type ThemeJson = {
  name: string;
  type: string;
  colors?: Record<string, string>;
  tokenColors?: {
    name?: string;
    scope?: string | string[];
    settings: {
      foreground?: string;
      background?: string;
      fontStyle?: string;
    };
  }[];
  syntax?: Record<string, string>;
};

export type ColorUsageMap = Record<string, string[]>;
export type TokenColorMap = Record<
  string,
  { scope: string[]; type: "foreground" | "background" }
>;
export type SyntaxMap = Record<string, string[]>;

export interface ColorMap {
  colorsMap: ColorUsageMap;
  tokenColorsMap: TokenColorMap;
  syntaxMap: SyntaxMap;
}

// Define types for global settings
export interface GlobalCustomizations {
  colors: Record<string, string>;
  tokenColors: Array<{
    scope: string[];
    settings: { foreground?: string; background?: string };
  }>;
}
