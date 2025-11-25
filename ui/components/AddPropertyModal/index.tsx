import { useState, type FC } from "react";
import Modal from "../Modal";
import ColorBox from "../ColorBox";
import { vscode } from "../../useStore";
import styles from "./addproperty.module.css";

interface AddPropertyModalProps {
  onAccept: (isAccepted: boolean) => void;
  translations: Record<string, string>;
}

const regexMap: Record<string, RegExp> = {
  workbench: /^([a-zA-Z][a-zA-Z0-9]*\.)*([a-zA-Z0-9]+\.)*[a-zA-Z0-9]+$/,
  token: /^([a-zA-Z0-9_.:@\-\s])+$/,
  semantic: /^([a-zA-Z0-9_.:@\-\s])+$/,
  syntax: /^([a-zA-Z0-9_.:@\-\s])+$/,
};

const errorMap: Record<string, string> = {
  workbench: "Invalid workbench color property. Example: editor.background",
  token: "Invalid token color property.",
  semantic: "Invalid semantic color property.",
  syntax: "Invalid syntax property.",
};

const placeholderMap: Record<string, string> = {
  workbench: "e.g., editor.background",
  token: "e.g., keyword",
  semantic: "e.g., variable",
  syntax: "e.g., string",
};

const AddPropertyModal: FC<AddPropertyModalProps> = ({
  onAccept,
  translations,
}) => {
  const [type, setType] = useState("workbench");
  const [name, setName] = useState("");
  const [color, setColor] = useState("#ffffff");
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const isAlphaEnabled = type === "workbench";

  const validateName = (value: string) => {
    if (!value) {
      setError("");
      return false;
    }
    const regex = regexMap[type];
    const valid = regex.test(value);
    setError(valid ? "" : errorMap[type]);
    return valid;
  };

  const isValid = name && !error && touched;

  const handleAccept = () => {
    if (isValid) {
      vscode.postMessage({
        command: "add",
        type,
        property: name,
        color,
      });
      onAccept(true);
    }
  };

  const handleCancel = () => {
    onAccept(false);
  };

  const handleModalAction = (isAccepted: boolean) => {
    if (isAccepted) {
      handleAccept();
    } else {
      handleCancel();
    }
  };

  const handleNameBlur = () => {
    setTouched(true);
    if (name) {
      validateName(name);
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setName(value);
    if (touched) {
      validateName(value);
    }
  };

  return (
    <Modal
      isFullWidth
      onAccept={handleModalAction}
      hasCancel={true}
      message={translations["Add property"]}
      acceptText={translations["Apply"]}
      isApplyEnabled={!!isValid}
    >
      <div className={styles.parent}>
        <div className={styles.body}>
          <label className={styles.header}>
            {translations["Property type"]}
          </label>
          <div className={`${styles.select} vscode-select`}>
            <select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setError("");
                setTouched(false);
                setName("");
              }}
            >
              <option value="workbench">
                {translations["Workbench Colors"]}
              </option>
              <option value="token">
                {translations["TextMate Token Colors"]}
              </option>
              <option value="semantic">
                {translations["Semantic Token Colors"]}
              </option>
              <option value="syntax">{translations["Syntax Colors"]}</option>
            </select>
            <i className="chevron-icon codicon codicon-chevron-down icon-arrow" />
          </div>
        </div>

        <div>
          <input
            type="text"
            value={name}
            onChange={handleNameChange}
            onBlur={handleNameBlur}
            placeholder={placeholderMap[type]}
            className={`${styles.input} vscode-input`}
          />
          {error && touched && <span className={styles.error}>{error}</span>}
        </div>

        <ColorBox
          value={color}
          setValue={setColor}
          hasAlpha={isAlphaEnabled}
          hasColorPalette
        />
      </div>
    </Modal>
  );
};

export default AddPropertyModal;
