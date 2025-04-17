import React from "react";
import styles from "./modal.module.css";

interface FullscreenModalProps {
  onAccept: (isAccepted: boolean) => void;
}

const FullscreenModal: React.FC<FullscreenModalProps> = ({ onAccept }) => {
  return (
    <div className={styles.fullscreenModal}>
      <div className={styles.modalContent}>
        <h3 className={styles.disclaimer}>
          Are you sure you want to reset the color?
        </h3>
        <div className={styles.btnWrapper}>
          <button
            className="vscode-button secondary"
            onClick={() => onAccept(false)}
          >
            Cancel
          </button>
          <button className="vscode-button" onClick={() => onAccept(true)}>
            Apply
          </button>
        </div>
      </div>
    </div>
  );
};

export default FullscreenModal;
