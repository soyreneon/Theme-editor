import { type FC } from "react";
import styles from "./typelist.module.css";
import { useStore } from "../../useStore";

interface TypeListProps {
  color: string;
  list: string[];
  title: string;
  link: string;
}

const TypeList: FC<TypeListProps> = ({ color, list, title, link }) => {
  const store = useStore();
  const { translations } = store;
  return (
    list && (
      <div className={styles.typeContainer} style={{ borderLeftColor: color }}>
        <div className={styles.header}>
          <h4>
            {title} ({list.length})
          </h4>
          <a href={link}>
            {translations["Learn more"]}
            <i className="codicon codicon-arrow-small-right"></i>
          </a>
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
