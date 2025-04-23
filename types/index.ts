export type ThemeJson = {
  name: string;
  type?: string;
  colors?: Record<string, string>;
  tokenColors?: TextMateRule[];
  // tokenColors?: {
  //   name?: string;
  //   scope?: string | string[];
  //   settings: {
  //     foreground?: string;
  //     background?: string;
  //     fontStyle?: string;
  //   };
  // }[];
  syntax?: Record<string, string>;
};

export type ColorStructure = Record<string, string[]>;
// export type ColorUsageMap = Record<string, string[]>;
// export type SyntaxMap = Record<string, string[]>;
export type TokenColor = { scope: string[]; type: "foreground" | "background" };
export type TokenColorMap = Record<string, TokenColor>; // {"value": {scope: '', type: 'foreground'}}

export interface ColorMap {
  colorsMap: ColorStructure;
  tokenColorsMap: TokenColorMap;
  syntaxMap: ColorStructure;
}

// Define types for global settings
export interface GlobalCustomizations {
  colors: Record<string, string>;
  tokenColors: TextMateRule[];
  // tokenColors: Array<{
  //   scope: string[];
  //   settings: { foreground?: string; background?: string };
  // }>;
}

// settings.json tokenColors
export interface TokenColorCustomization {
  comments?: string;
  keywords?: string;
  strings?: string;
  numbers?: string;
  types?: string;
  functions?: string;
  variables?: string;
  textMateRules?: TextMateRule[];
  [customScope: string]: any; // allow propeties not defined as "textMateRules"
}

export interface TextMateRule {
  name?: string;
  scope: string | string[];
  settings: {
    foreground?: string;
    background?: string;
    fontStyle?: string;
  };
}
