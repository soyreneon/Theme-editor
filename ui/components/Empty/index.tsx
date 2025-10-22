import { useStore } from "../../useStore";
import styles from "./empty.module.css";

const Empty = () => {
  const store = useStore();
  const { translations } = store;

  return (
    <div className={styles.empty}>
      <hr className="vscode-divider" />
      <i className={`${styles.icon} codicon codicon-search-stop`}></i>
      <hr className="vscode-divider" />
      <p>{translations["No results found"]}</p>
    </div>
  );
};

export default Empty;
