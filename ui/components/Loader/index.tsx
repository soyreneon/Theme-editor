import { type FC } from "react";
import styles from "./loader.module.css";

const Loader: FC = () => {
  return (
    <>
      <hr className="vscode-divider" />
      <div className={styles.loaderWrapper}>
        <div className={styles.loader}></div>
      </div>
    </>
  );
};

export default Loader;
