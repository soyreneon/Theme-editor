import { type FC } from "react";
import styles from "./typelist.module.css";
import { useStore } from "../../useStore";

interface TypeListProps {
  list: string[];
  title: string;
  link: string;
}

const TypeList: FC<TypeListProps> = ({ list, title, link }) => {
  const store = useStore();
  const { translations } = store;
  return (
    list && (
      <div className={styles.typeContainer}>
        <div className={styles.header}>
          <h4>{title}</h4>
          <a href={link}>{translations["Learn more"]}</a>
        </div>
        <ul>
          {list.map((key) => (
            <li key={key}>
              <span>{key}</span>
            </li>
          ))}
        </ul>
      </div>
    )
  );
};

export default TypeList;
