import React, { useRef, useEffect } from "react";
import { Filter } from "../../../types";
import EyeDropper from "../EyeDropper";
import { useStore } from "../../useStore";
import styles from "./filter.module.css";

const Filter = () => {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const store = useStore();
  const {
    translations,
    setFilter,
    filter,
    setSearchString,
    searchString,
    loading,
  } = store;

  useEffect(() => {
    if (!loading && inputRef.current) {
      inputRef.current.value = searchString;
    }
  }, [loading]);

  const handleFilter = (e: React.ChangeEvent<HTMLSelectElement>) =>
    setFilter(e.target.value as Filter);

  const onInputChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setSearchString(e.target.value);

  const handleEyeDropper = (hex: string) => {
    if (inputRef.current) {
      inputRef.current.value = hex;
      setSearchString(hex);
    }
  };

  const handleClear = () => {
    if (inputRef.current) {
      inputRef.current.value = "";
      setSearchString("");
    }
  };

  return (
    <>
      <div className={styles.inlineFilter}>
        <span>{translations["Filter"]}</span>
        <div className="vscode-select">
          <select
            name="filter"
            id="filter"
            onChange={handleFilter}
            value={filter}
          >
            <option value="all">{translations["All"]}</option>
            <option value="colors">{translations["Workbench Colors"]}</option>
            <option value="tokenColors">
              {translations["TextMate Token Colors"]}
            </option>
            <option value="syntax">{translations["Syntax Colors"]}</option>
            <option value="semanticTokenColors">
              {translations["Semantic Token Colors"]}
            </option>
          </select>
          <i className="chevron-icon codicon codicon-chevron-down icon-arrow" />
        </div>
      </div>
      <hr className="vscode-divider" />
      <div className={styles.inputBox}>
        <EyeDropper onChange={handleEyeDropper} color={searchString} />
        <div className={styles.inputIcon}>
          <input
            ref={inputRef}
            type="input"
            placeholder={translations["Type color, prop or use the eyedropper"]}
            onChange={onInputChange}
          />
          {inputRef.current?.value ? (
            <button
              onClick={handleClear}
              className={styles.close}
              aria-label={translations["clear"]}
            >
              <i className="codicon codicon-close" />
            </button>
          ) : (
            <i className="codicon codicon-search" />
          )}
        </div>
      </div>
      <hr className="vscode-divider" />
    </>
  );
};

export default Filter;
