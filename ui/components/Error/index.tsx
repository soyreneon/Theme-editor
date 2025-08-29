import { type FC } from "react";
import styles from "./error.module.css";

interface ErrorProps {
  error: string;
}

const Error: FC<ErrorProps> = ({ error }) => {
  return (
    <div className={styles.error}>
      <br />
      <i className={`${styles.icon} codicon codicon-bracket-error`}></i>

      <hr className="vscode-divider" />
      <p>Sorry we couldn't open this theme. Try another one</p>
      <hr className="vscode-divider" />
      <br />
      <blockquote>{JSON.stringify(error)}</blockquote>
      <hr className="vscode-divider" />
      <br />
      <small>
        <i> Report to ThemeTuner creator to fix this issue.</i>
      </small>
    </div>
  );
};

export default Error;
