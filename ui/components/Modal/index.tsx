import React from "react";
import styles from "./modal.module.css";
import { useStore } from "../../useStore";

interface FullscreenModalProps {
  onAccept: (isAccepted: boolean) => void;
  message: string;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({
  onAccept,
  message,
}) => {
  const store = useStore();
  const { translations } = store;
  return (
    <div className={styles.fullscreenModal}>
      <div className={styles.modalContent}>
        <h4 className={styles.disclaimer}>{message}</h4>
        <div className={styles.btnWrapper}>
          <button
            className="vscode-button secondary"
            onClick={() => onAccept(false)}
          >
            {translations["Cancel"]}
          </button>
          <button className="vscode-button" onClick={() => onAccept(true)}>
            {translations["Apply"]}
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenModal;
