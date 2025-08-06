import { type FC, type PropsWithChildren } from "react";
import styles from "./tooltip.module.css";

interface TooltipProps {
  caption: string | null;
  direction: "top" | "bottom" | "left" | "right";
}

const Tooltip: FC<PropsWithChildren<TooltipProps>> = ({
  caption,
  direction = "top",
  children,
}) => {
  return (
    <section className={styles.tooltipContainer}>
      {children}
      <span className={`${styles.tooltip} ${styles[direction]}`}>
        {caption}
      </span>
    </section>
  );
};

export default Tooltip;
