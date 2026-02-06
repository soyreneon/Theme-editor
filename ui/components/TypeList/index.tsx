import { type FC } from "react";
import styles from "./typelist.module.css";
import { useStore } from "../../useStore";
import { type Filter } from "../../../types";
import Checkbox from "../Checkbox";
import PropertyItemModal from "../PropertyItemModal";

interface TypeListProps {
  color: string;
  list: string[];
  title: string;
  link: string;
  type: Filter;
  onToggleChecked?: (value: boolean) => void;
}

const TypeList: FC<TypeListProps> = ({
  color,
  list,
  title,
  link,
  type,
  onToggleChecked,
}) => {
  const store = useStore();
  const { translations, filter } = store;
  const checkId = `add-${color.slice(1)}-${title.replace(/\s+/g, "")}`;
  const propsList = list?.sort();

  if (type !== filter && filter !== "all") return null;
  return (
    list && (
      <div className={styles.typeContainer} style={{ borderLeftColor: color }}>
        <div className={styles.header}>
          {filter === "all" ? (
            <Checkbox
              id={checkId}
              title={`${title} (${list.length})`}
              onToggleChecked={onToggleChecked}
            />
          ) : (
            <span className="text">
              <h4>
                {title} ({list.length})
              </h4>
            </span>
          )}

          <a href={link}>
            <span>{translations["Learn more"]}</span>
            <i className="codicon codicon-arrow-small-right"></i>
          </a>
        </div>
        <ul>
          {propsList.map((prop) => (
            <li key={prop}>
              <PropertyItemModal prop={prop} type={type} color={color} />
            </li>
          ))}
        </ul>
      </div>
    )
  );
};

export default TypeList;
