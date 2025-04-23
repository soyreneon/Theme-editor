import {
  type TokenColorCustomization,
  type TextMateRule,
  type TokenColor,
} from "../types/";

export const updateColor = () => {};

export const updateTokenColorCustomization = (
  themeTokenColorCustomizations: TokenColorCustomization,
  settingsTokenKeys: TokenColor,
  previousColor: string,
  newColor: string
): TokenColorCustomization => {
  const updatedRules: TextMateRule[] = [];
  let merged = false;

  (themeTokenColorCustomizations?.textMateRules as TextMateRule[]).forEach(
    (rule) => {
      const currentTypeColor = rule.settings[settingsTokenKeys.type];
      const ruleScopes = Array.isArray(rule.scope) ? rule.scope : [rule.scope];

      // Si la regla tiene el color anterior y alguno de los scopes, la eliminamos
      const hasMatchingScope = settingsTokenKeys.scope.some((s) =>
        ruleScopes.includes(s)
      );

      console.log(
        "** before",
        hasMatchingScope,
        currentTypeColor,
        previousColor,
        newColor
      );

      if (
        hasMatchingScope &&
        currentTypeColor &&
        currentTypeColor.toLowerCase() === previousColor.toLowerCase()
      ) {
        console.log("** skip");
        return; // skip (i.e., "remove" this rule)
      }

      // Si tiene el mismo color nuevo, añadimos los nuevos scopes
      if (
        currentTypeColor &&
        currentTypeColor.toLowerCase() === newColor.toLowerCase()
      ) {
        console.log("** new");

        const mergedScopes = Array.from(
          new Set([...ruleScopes, ...settingsTokenKeys.scope])
        );
        updatedRules.push({
          ...rule,
          scope: mergedScopes,
        });
        merged = true;
        return;
      }

      updatedRules.push(rule);
    }
  );

  // Si no se encontró ninguna coincidencia con el nuevo color, se crea una nueva regla
  if (!merged) {
    updatedRules.push({
      name: `Updated ${settingsTokenKeys.type} color`,
      scope: settingsTokenKeys.scope,
      settings: {
        [settingsTokenKeys.type]: newColor,
      },
    });
  }

  return {
    textMateRules: updatedRules,
  };
};

// Helper function to normalize color to 6-digit hex without alpha and uppercase
export const normalizeColor = (color: string): string => {
  if (color.length === 4) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  } else if (color.length === 5) {
    return `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`.toUpperCase();
  } else if (color.length === 9) {
    return color.substring(0, 7).toUpperCase();
  }
  return color.toUpperCase();
};

// get alpha chanel in color code
export const getAlpha = (color: string): string | null => {
  if (color.length === 5) {
    return `${color[4]}${color[4]}`.toUpperCase();
  } else if (color.length === 9) {
    return color.substring(7, 9).toUpperCase();
  }
  return null;
};

/*
  public updateColor = (previousColor: string, newColor: string) => {
    // this.colormaps;
    // this.themeObj.colors.
    if (this.colormaps.colorsMap[previousColor]) {
      //
      const settingsKeys = this.colormaps.colorsMap[previousColor];
      settingsKeys.forEach((setting) => {
        console.log(this.themeName);
        // if (normalizeColor(this.themeObj.colors?.[setting] ?? "")){
        // }
        //
        // console.log(
        //   "** setting",
        //   JSON.stringify(this.themeObj.colors?.[setting])
        // );
        // setting
      });
    }
    // console.log("** to xd", JSON.stringify(this.colormaps));
    // console.log("** to update", this.colormaps.colorsMap[previousColor]);
    // console.log("** to update", this.colormaps.tokenColorsMap[previousColor]);
    // console.log("** to update", this.colormaps.syntaxMap[previousColor]);
  };
  */
