import { FC, type PropsWithChildren } from "react";
import styles from "./modal.module.css";
import { useStore } from "../../useStore";

interface FullscreenModalProps {
  onAccept: (isAccepted: boolean) => void;
  message?: string;
  isApplyEnabled?: boolean;
}

const FullscreenModal: FC<PropsWithChildren<FullscreenModalProps>> = ({
  onAccept,
  message,
  isApplyEnabled = true,
  children,
}) => {
  const store = useStore();
  const { translations } = store;
  return (
    <div className={styles.fullscreenModal}>
      <div className={styles.modalContent}>
        {message && <h4 className={styles.disclaimer}>{message}</h4>}
        {children}
        <div className={styles.btnWrapper}>
          <button
            className="vscode-button secondary"
            onClick={() => onAccept(false)}
          >
            {translations["Cancel"]}
          </button>
          <button
            className="vscode-button"
            onClick={() => onAccept(true)}
            disabled={!isApplyEnabled}
          >
            {translations["Apply"]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenModal;
