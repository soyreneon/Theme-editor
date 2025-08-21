import { type FC, type PropsWithChildren } from "react";
import styles from "./tooltip.module.css";

export interface TooltipProps {
  caption: string | null;
  direction: "top" | "bottom" | "left" | "right";
  extraPadding?: number;
}

const Tooltip: FC<PropsWithChildren<TooltipProps>> = ({
  caption,
  direction = "top",
  extraPadding = false,
  children,
}) => {
  return (
    <section className={styles.tooltipContainer}>
      {children}
      <span
        className={`${styles.tooltip} ${styles[direction]}`}
        style={{
          [direction]: `${extraPadding}px`,
        }}
      >
        {caption}
      </span>
    </section>
  );
};

export default Tooltip;
