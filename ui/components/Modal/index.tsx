import { FC, type PropsWithChildren, useEffect } from "react";
import styles from "./modal.module.css";
import { useStore } from "../../useStore";

interface FullscreenModalProps {
  onAccept: (isAccepted: boolean) => void;
  message?: string;
  acceptText?: string;
  isApplyEnabled?: boolean;
  hasCancel?: boolean;
  isFullWidth?: boolean;
}

const FullscreenModal: FC<PropsWithChildren<FullscreenModalProps>> = ({
  onAccept,
  message,
  isFullWidth,
  hasCancel = true,
  acceptText,
  isApplyEnabled = true,
  children,
}) => {
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  const store = useStore();
  const { translations } = store;
  return (
    <div className={styles.fullscreenModal}>
      <div
        className={styles.modalContent}
        {...(isFullWidth && { style: { width: "100%" } })}
      >
        {message && <h4 className={styles.disclaimer}>{message}</h4>}
        {children}
        <div className={styles.btnWrapper}>
          {hasCancel && (
            <button
              className="vscode-button secondary"
              onClick={() => {
                onAccept(false);
              }}
            >
              {translations["Cancel"]}
            </button>
          )}
          <button
            className="vscode-button"
            onClick={() => {
              onAccept(true);
            }}
            disabled={!isApplyEnabled}
          >
            {acceptText || translations["Apply"]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenModal;
