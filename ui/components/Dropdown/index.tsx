import { useState, useRef, useEffect, type FC } from "react";
import styles from "./dropdown.module.css";

export type Button = {
  caption: string;
  onClick: () => void;
};
interface DropdownProps {
  buttons: Button[];
}

const Dropdown: FC<DropdownProps> = ({ buttons }) => {
  const divRef = useRef<HTMLDivElement | null>(null);

  const [isDropdownOpen, setIsDropdownOpen] = useState<boolean>(false);

  useEffect(() => {
    function assertIsNode(e: EventTarget | null): asserts e is Node {
      if (!e || !("nodeType" in e)) {
        throw new Error(`Node expected`);
      }
    }
    const closeDropdown = ({ target }: MouseEvent): void => {
      assertIsNode(target);
      if (!divRef.current?.contains(target)) {
        setIsDropdownOpen(false);
      }
    };
    document.body.addEventListener("click", closeDropdown);
    return () => document.body.removeEventListener("click", closeDropdown);
  }, []);

  return (
    <div className={styles.dropdownWrapper} ref={divRef}>
      <button
        type="button"
        className="vscode-action-button"
        onClick={() => setIsDropdownOpen((prev) => !prev)}
      >
        <i className="codicon codicon-gear"></i>
      </button>

      <div
        className={`${styles.dropdownMenu} ${isDropdownOpen && styles.show}`}
        data-selected="messenger"
      >
        {buttons.map((button) => (
          <button
            type="button"
            value="messenger"
            tab-index="0"
            className={styles.dropdownItem}
            onClick={() => {
              button.onClick();
              setIsDropdownOpen(false);
            }}
          >
            {button.caption}
          </button>
        ))}
      </div>
    </div>
  );
};

export default Dropdown;
