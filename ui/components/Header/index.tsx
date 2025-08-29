import { useState, type FC } from "react";
import { vscode, useStore } from "../../useStore";
import ActionButton from "../ActionButton";
import Modal from "../Modal";
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
  const handleExport = () => {
    vscode.postMessage({
      command: "exportTheme",
    });
  };

  return (
    <header>
      <hr className="vscode-divider" />
      <div className={styles.headline}>
        <h4>
          {translations["Theme"]}: {title}
        </h4>
        <div>
          <ActionButton
            caption={translations["reset theme"]}
            direction="bottom"
            icon="clear-all"
            onClick={handleReset}
          />
          <ActionButton
            caption={translations["refresh"]}
            direction="bottom"
            icon="refresh"
            onClick={handleRefresh}
          />
          <ActionButton
            caption={translations["export theme"]}
            direction="bottom"
            icon="export"
            onClick={handleExport}
          />
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
              "Are you sure you want to reset this theme?, it will revert to the default theme values and removes custom names and pins."
            ]
          }
        />
      )}
    </header>
  );
};

export default Header;
