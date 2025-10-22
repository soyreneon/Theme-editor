import { type FC, useState } from "react";
import styles from "./checkbox.module.css";

interface CheckboxProps {
  id: string;
  title: string;
  onToggleChecked?: (value: boolean) => void;
  isDefaultChecked?: boolean;
}

const Checkbox: FC<CheckboxProps> = ({
  id,
  title,
  onToggleChecked,
  isDefaultChecked = true,
}) => {
  const [isChecked, setIsChecked] = useState<boolean>(isDefaultChecked);

  const onHandleCheck = () => {
    setIsChecked((prev) => {
      onToggleChecked?.(!prev);
      return !prev;
    });
  };

  return (
    <div className="vscode-checkbox">
      <input type="checkbox" id={id} onChange={onHandleCheck} />
      <label htmlFor={id}>
        <span className="icon">
          <i
            className={`codicon codicon-check icon-checked ${
              !isChecked && styles.unchecked
            }`}
          ></i>
        </span>
        <span className="text">
          <h4>{title}</h4>
        </span>
      </label>
    </div>
  );
};

export default Checkbox;
