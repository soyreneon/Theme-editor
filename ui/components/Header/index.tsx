import { useState, type FC } from "react";
import { vscode, useStore } from "../../useStore";
import Modal from "../Modal";
import Tooltip from "../Tooltip";
import styles from "./header.module.css";

interface HeaderProps {
  title: string | null;
  count: number;
}

const Header: FC<HeaderProps> = ({ title, count }) => {
  const store = useStore();
  const { translations, setLoading } = store;
  const [isModalShown, setIsModalShown] = useState<boolean>(false);
  const handleModal = (isAccepted: boolean) => {
    if (isAccepted) {
      vscode.postMessage({
        command: "resetTheme",
      });
    }
    setIsModalShown(false);
  };

  const handleReset = () => {
    setIsModalShown(true);
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      vscode.postMessage({
        command: "refreshTheme",
      });
    }, 800);
  };

  return (
    <header>
      <hr className="vscode-divider" />
      <div className={styles.headline}>
        <h4>
          {translations["Theme"]}: {title}
        </h4>
        <div>
          <Tooltip caption={translations["reset theme"]} direction="bottom">
            <button
              type="button"
              className="vscode-action-button"
              onClick={handleReset}
            >
              <i className="codicon codicon-clear-all"></i>
            </button>
          </Tooltip>
          <Tooltip caption={translations["refresh"]} direction="bottom">
            <button
              type="button"
              className="vscode-action-button"
              onClick={handleRefresh}
            >
              <i className="codicon codicon-refresh"></i>
            </button>
          </Tooltip>
        </div>
      </div>
      <h5>
        {translations["Color count"]}: {count}
      </h5>
      <hr className="vscode-divider" />
      {isModalShown && (
        <Modal
          onAccept={handleModal}
          message={
            translations[
              "Are you sure you want to reset this theme?, it will revert to the default theme values."
            ]
          }
        />
      )}
    </header>
  );
};

export default Header;
