import { type FC, type ButtonHTMLAttributes } from "react";
import Tooltip, { TooltipProps } from "../Tooltip";

interface ActionButtonProps extends TooltipProps {
  icon: string;
  visible?: boolean;
}

type ButtonProps = ActionButtonProps & ButtonHTMLAttributes<HTMLButtonElement>;

const ActionButton: FC<ButtonProps> = ({
  icon,
  visible = true,
  caption,
  direction,
  ...props
}) => {
  if (!visible) return null;
  return (
    <Tooltip caption={caption} direction={direction}>
      <button type="button" className="vscode-action-button" {...props}>
        <i className={`codicon codicon-${icon}`}></i>
      </button>
    </Tooltip>
  );
};

export default ActionButton;
