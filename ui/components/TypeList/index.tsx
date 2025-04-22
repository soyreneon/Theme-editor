import { type FC } from "react";
import styles from "./typelist.module.css";

interface TypeListProps {
  list: string[];
  title: string;
  link: string;
}

const TypeList: FC<TypeListProps> = ({ list, title, link }) => {
  return (
    list && (
      <div className={styles.typeContainer}>
        <div className={styles.header}>
          <h4>{title}</h4>
          <a href={link}>Learn more</a>
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
