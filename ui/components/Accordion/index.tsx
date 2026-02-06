import { type FC, useEffect, useRef, useMemo, useState } from "react";
import { type ColorMap, type TunerSettings } from "../../../types";
import AccordionContent from "./AccordionContent";
import SimpleContent from "./SimpleContent";
import TextMatch from "../TextMatch";
import styles from "./accordion.module.css";
import { useStore } from "../../useStore";
import { useDebounce } from "../../hooks/useDebounce";
import { isHexColorPart, cleanString } from "../../utils";

interface AccordionProps {
  color: string;
  colormaps: ColorMap;
  customColorList: string[];
  settings: TunerSettings;
  onTriggerScroll: (value: number) => void;
}

const colorTypes = ["colors", "tokenColors", "syntax", "semanticTokenColors"];

const Accordion: FC<AccordionProps> = ({
  color,
  colormaps,
  customColorList,
  settings,
  onTriggerScroll,
}) => {
  const store = useStore();
  const {
    filter,
    lastColorChanged,
    setLastColorChanged,
    tunerSettings,
    searchString,
    simpleSearchEnabled,
  } = store;
  const debouncedSearch = useDebounce<string>(searchString, 500);
  const accordionRef = useRef<HTMLDetailsElement>(null);
  const isOpen = useMemo(() => color === lastColorChanged, []);
  const [isAccordionOpen, setIsAccordionOpen] = useState(isOpen);

  useEffect(() => {
    // timeout to wait for tunersettings case
    setTimeout(() => {
      if (accordionRef.current && color === lastColorChanged) {
        onTriggerScroll(accordionRef.current.offsetTop);
        setLastColorChanged("");
      }
    }, 200);
  }, [lastColorChanged, tunerSettings]);

  const onToggleAccordion = (e: React.MouseEvent): void => {
    e.stopPropagation();
    setIsAccordionOpen((prev) => !prev);
  };

  const getColorLength = (arr: any[]): number => (arr ?? []).length;

  const getCurrentCount = (): number => {
    if (colorTypes.includes(filter)) {
      return getColorLength(
        (filter === "tokenColors"
          ? colormaps.tokenColorsMap[color]?.scope
          : colormaps[`${filter}Map` as keyof ColorMap][color]) as []
      );
    }

    return colorTypes.reduce((acc: number, current) => {
      return (
        acc +
        getColorLength(
          (current === "tokenColors"
            ? colormaps.tokenColorsMap[color]?.scope
            : colormaps[`${current}Map` as keyof ColorMap][color]) as []
        )
      );
    }, 0) as number;
  };

  const count = getCurrentCount();
  const hasCustomizations = customColorList.includes(color);

  const getIsEmptyColor = (): boolean => {
    if (filter === "all") {
      return false;
    }
    if (
      filter === "tokenColors" &&
      getColorLength(colormaps.tokenColorsMap[color]?.scope) > 0
    ) {
      return false;
    }
    if (
      colorTypes.includes(filter) &&
      getColorLength(colormaps[`${filter}Map` as keyof ColorMap][color] as []) >
        0
    ) {
      return false;
    }

    return true;
  };

  if (getIsEmptyColor()) {
    return null;
  }

  // console.log("h"); // debug re-renders

  if (
    simpleSearchEnabled &&
    cleanString(debouncedSearch) !== "" &&
    !isHexColorPart(cleanString(debouncedSearch))
  ) {
    return (
      <SimpleContent
        color={color}
        colormaps={colormaps}
        match={debouncedSearch}
      />
    );
  }

  return (
    <details
      ref={accordionRef}
      className="vscode-collapsible"
      {...(isOpen && { open: true })}
    >
      <summary onClick={onToggleAccordion}>
        <i className="codicon codicon-chevron-right icon-arrow"></i>
        <h2 className="title">
          <span
            className={styles.colorPreview}
            style={{ backgroundColor: color }}
          />
          {settings?.[color]?.pinned ? (
            <span className={styles.pinned}>
              <i className="codicon codicon-pin"></i>
              &nbsp; &nbsp; &nbsp;
            </span>
          ) : null}
          <span className={styles.colorheader}>
            <TextMatch text={color} match={debouncedSearch} />
            {settings?.[color]?.name && (
              <span className={styles.name}> ({settings?.[color]?.name})</span>
            )}
            {hasCustomizations ? " * " : " "}
          </span>
        </h2>
        <div className={styles.badgeContainer}>
          <span className="vscode-badge activity-bar-counter">{count}</span>
        </div>
      </summary>
      <div>
        {isAccordionOpen && (
          <AccordionContent
            color={color}
            colormaps={colormaps}
            hasCustomizations={hasCustomizations}
          />
        )}
      </div>
    </details>
  );
};

export default Accordion;
