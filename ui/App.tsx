import "@vscode-elements/elements-lite/components/divider/divider.css";
import "@vscode-elements/elements-lite/components/button/button.css";
import "@vscode-elements/elements-lite/components/action-button/action-button.css";
import "@vscode-elements/elements-lite/components/badge/badge.css";
import "@vscode-elements/elements-lite/components/collapsible/collapsible.css";
import "@vscode-elements/elements-lite/components/checkbox/checkbox.css";
import "@vscode-elements/elements-lite/components/select/select.css";
import "./App.css";
import { useEffect, useState } from "react";
import chroma from "chroma-js";
import { useStore, vscode } from "./useStore";
import captions from "./language";
import Accordion from "./components/Accordion";
import Loader from "./components/Loader";
import Header from "./components/Header";
import Error from "./components/Error";
import Filter from "./components/Filter";
import Empty from "./components/Empty";
import Message from "./components/Message";
import { useDebounce } from "./hooks/useDebounce";

export function App() {
  const store = useStore();
  const [list, setList] = useState<string[]>([]);
  const [scroll, setScroll] = useState<number>(0);

  const {
    title,
    colorOrders,
    colorMap,
    filter,
    customColorList,
    loading,
    tunerSettings,
    error,
    message,
    searchString,
  } = store;
  const debouncedSearch = useDebounce<string>(searchString, 500);

  useEffect(() => {
    // call vscode api when ui is ready
    vscode.postMessage({
      command: "ui-ready",
      captions,
    });
  }, []);

  useEffect(() => {
    const isHexColorPart = (str: string): boolean => {
      const regex = /^[#abcdefABCDEF012345679]+$/i;
      return regex.test(str);
    };
    const cleanString = (s: string) => s.toLowerCase().trim();

    if (debouncedSearch) {
      if (debouncedSearch.length >= 6 && chroma.valid(debouncedSearch)) {
        // is an exact color match or close color
        type Counts = Record<string, { count: number }>;

        const sortByNumber = (counts: Counts): string[] =>
          Object.entries(counts)
            .sort((a, b) => a[1].count - b[1].count) // least distance first
            .map(([color]) => color);

        const listData = colorOrders[filter].reduce((acc, current) => {
          const distance = chroma.valid(current)
            ? chroma.distance(current, debouncedSearch.trim(), "rgb")
            : 0;
          if (distance < 25) {
            return { ...acc, [current]: { count: distance } };
          }
          return acc;
        }, {} as Counts);
        setList(sortByNumber(listData));
      } else if (isHexColorPart(debouncedSearch.trim())) {
        // is a substring color
        const newList = colorOrders[filter].filter((color) =>
          color
            .toLowerCase()
            .includes(cleanString(debouncedSearch.replace("#", "")))
        );
        setList(newList);
      } else {
        // is a prop
        const newList = colorOrders[filter].filter((color) => {
          if (["all", "colors"].includes(filter)) {
            const isMatch = colorMap.colorsMap[color]?.find((p) =>
              cleanString(p).includes(cleanString(debouncedSearch))
            );
            if (isMatch) return true;
          }
          if (["all", "tokenColors"].includes(filter)) {
            const isMatch = colorMap.tokenColorsMap[color]?.scope?.find((p) =>
              cleanString(p).includes(cleanString(debouncedSearch))
            );
            if (isMatch) return true;
          }
          if (["all", "syntax"].includes(filter)) {
            const isMatch = colorMap.syntaxMap[color]?.find((p) =>
              cleanString(p).includes(cleanString(debouncedSearch))
            );
            if (isMatch) return true;
          }
          if (["all", "semanticTokenColors"].includes(filter)) {
            const isMatch = colorMap.semanticTokenColorsMap[color]?.find((p) =>
              cleanString(p).includes(cleanString(debouncedSearch))
            );
            if (isMatch) return true;
          }
          return false;
        });
        setList(newList);
      }
    } else {
      const settings = Object.keys(tunerSettings);
      const newList = colorOrders[filter].filter(
        (color) => !tunerSettings?.[color]?.pinned
      );
      settings.map((setting) => {
        const isOnList = colorOrders[filter].includes(setting);
        if (tunerSettings?.[setting]?.pinned && isOnList) {
          newList.unshift(setting);
        }
      });
      setList(newList);
    }
  }, [tunerSettings, filter, debouncedSearch]);

  useEffect(() => {
    if (scroll > 0) {
      // container.scrollTop = scroll;
      // container.scrollTo({
      //   top: scroll,
      //   behavior: "smooth",
      // });
      window.scrollTo({
        top: scroll,
        behavior: "smooth",
      });
      setScroll(0);
    }
  }, [scroll]);

  if (loading) {
    return <Loader />;
  }
  if (error !== "") {
    return <Error error={error} />;
  }

  return (
    <>
      {message && <Message text={message} />}
      <Header title={title} count={colorOrders.all.length} />
      <Filter />
      {list.length > 0 ? (
        list.map((color) => (
          <Accordion
            color={color}
            colormaps={colorMap}
            onTriggerScroll={setScroll}
            key={`${color}-${filter}-${list.length}`}
            customColorList={customColorList}
            settings={tunerSettings}
          />
        ))
      ) : (
        <Empty />
      )}
      <hr className="vscode-divider" />
      <hr className="vscode-divider" />
      <hr className="vscode-divider" />
    </>
  );
}
