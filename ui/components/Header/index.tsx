import { useState, useEffect, type FC } from "react";
import { vscode, useStore } from "../../useStore";
// import ActionButton from "../ActionButton";
import Modal from "../Modal";
import Dropdown from "../Dropdown";
import styles from "./header.module.css";
import { type Button } from "../Dropdown";

interface HeaderProps {
  title: string | null;
  count: number;
}
// interface Button extends TooltipProps {
//   icon: string;
//   onClick: () => void;
// }

const Header: FC<HeaderProps> = ({ title, count }) => {
  const store = useStore();
  const { translations, setLoading, exportObj } = store;
  // const [isModalShown, setIsModalShown] = useState<boolean>(false);
  const [isCopied, setIsCopied] = useState<boolean>(false);
  const [modalStatus, setModalStatus] = useState<{
    status: boolean;
    type: string;
  }>({ status: false, type: "" });

  useEffect(() => {
    let timer = setTimeout(() => {
      isCopied && setIsCopied(false);
    }, 1200);

    return () => {
      clearTimeout(timer);
    };
  }, [isCopied]);

  const handleModal = (isAccepted: boolean) => {
    if (isAccepted) {
      vscode.postMessage({
        command: "resetTheme",
      });
    }
    // setIsModalShown(false);
    setModalStatus({ status: false, type: "" });
  };

  const handleReset = () => {
    // setIsModalShown(true);
    setModalStatus({ status: true, type: "reset" });
  };

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => {
      vscode.postMessage({
        command: "refreshTheme",
      });
    }, 800);
  };
  const handleCloseExport = () => {
    setModalStatus({ status: false, type: "" });
  };
  const handleExport = () => {
    /*
    vscode.postMessage({
      command: "exportTheme",
    });
    */
    setModalStatus({ status: true, type: "export" });
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(JSON.stringify(exportObj, null, 1));
      setIsCopied(true);
    } catch (err) {
      console.error("Failed to copy text: ", err);
    }
  };

  const buttons: Button[] = [
    {
      caption: translations["Reset theme"],
      // direction: "bottom",
      // icon: "clear-all",
      onClick: handleReset,
    },
    {
      caption: translations["Refresh"],
      // direction: "bottom",
      // icon: "refresh",
      onClick: handleRefresh,
    },
    {
      caption: translations["Export theme"],
      // direction: "bottom",
      // icon: "export",
      onClick: handleExport,
    },
  ];
  return (
    <header>
      <hr className="vscode-divider" />
      <div className={styles.headline}>
        <h4>
          {translations["Theme"]}: {title}
        </h4>
        <div>
          {/* <div className={styles.gear}> */}
          <Dropdown
            buttons={buttons as []}
            // buttons={buttons.map(({ icon, direction, ...keep }) => keep)}
          />
        </div>
        {/* <div className={styles.icons}>
          {buttons.map((button) => (
            <ActionButton {...button} />
          ))}
        </div> */}
      </div>
      <h5>
        {translations["Color count"]}: {count}
      </h5>
      <hr className="vscode-divider" />
      {/* {isModalShown && (
        <Modal
          onAccept={handleModal}
          message={
            translations[
              "Are you sure you want to reset this theme?, it will revert to the default theme values and removes custom names and pins."
            ]
          }
        />
      )} */}
      {modalStatus.status && (
        <>
          {modalStatus.type === "reset" && (
            <Modal
              onAccept={handleModal}
              message={
                translations[
                  "Are you sure you want to reset this theme?, it will revert to the default theme values and removes custom names and pins."
                ]
              }
            />
          )}
          {modalStatus.type === "export" && (
            <Modal
              isFullWidth
              hasCancel={false}
              onAccept={handleCloseExport}
              message={translations["Export theme"]}
              acceptText={translations["Close"]}
            >
              {/* <p>{translations["Export theme"]}</p> */}
              <pre className={styles.pre}>
                {/* <button>copy</button> */}
                <button
                  // type="button"
                  // className="vscode-button secondary"
                  type="button"
                  className={`vscode-action-button ${
                    isCopied && styles.copied
                  }`}
                  onClick={handleCopy}
                >
                  <i
                    className={`codicon codicon-${isCopied ? "check" : "copy"}`}
                    aria-hidden="true"
                  ></i>
                  <span>
                    {isCopied ? translations["Copied"] : translations["Copy"]}
                  </span>
                </button>

                <code className={styles.code}>
                  {JSON.stringify(exportObj, null, 1)}
                </code>
              </pre>
            </Modal>
          )}
        </>
      )}
    </header>
  );
};

export default Header;
