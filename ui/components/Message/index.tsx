import { type FC, useEffect } from "react";
import { useStore } from "../../useStore";
import styles from "./message.module.css";

interface MessageProps {
  text: string;
}

const Message: FC<MessageProps> = ({ text }) => {
  const store = useStore();
  const { setMessage } = store;

  const onClose = () => setMessage("");
  useEffect(() => {
    let timer = setTimeout(() => {
      setMessage("");
    }, 3500);

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (!text) return null;

  return (
    <div className={styles.message}>
      <div className={styles.container}>
        <button onClick={onClose}>
          <i className={`${styles.icon} codicon codicon-close`}></i>
        </button>
        <p>{text}</p>
      </div>
    </div>
  );
};

export default Message;
