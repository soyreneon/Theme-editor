import React, { type FC } from "react";
import styles from "./textMatch.module.css";

export interface TextMatchProps {
  text: string;
  match: string;
}

const TextMatch: FC<TextMatchProps> = ({ text, match }) => {
  if (match === "") {
    return <>{text}</>;
  }

  const parts = text.split(new RegExp(`(${match})`, "i"));

  if (parts.length === 1) {
    return <>{parts[0]}</>;
  }

  return (
    <>
      {parts.map((part, i) => (
        <React.Fragment key={`part${i}`}>
          {part.toLowerCase() === match.toLowerCase() ? (
            <span className={styles.match}>{part}</span>
          ) : (
            <>{part}</>
          )}
        </React.Fragment>
      ))}
    </>
  );
};

export default TextMatch;
