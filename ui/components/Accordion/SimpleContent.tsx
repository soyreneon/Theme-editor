import { type FC } from "react";
import { type ColorMap, type Filter } from "../../../types";
import PropertyItemModal from "../PropertyItemModal";

interface AccordionProps {
  color: string;
  match: string;
  colormaps: ColorMap;
}

const colorTypes = ["colors", "tokenColors", "syntax", "semanticTokenColors"];
const cleanString = (s: string) => s.toLowerCase().trim();

const Accordion: FC<AccordionProps> = ({ color, match, colormaps }) => {
  return (
    <>
      {colorTypes.map((mapped) => {
        const values = (
          mapped === "tokenColors"
            ? colormaps.tokenColorsMap[color]?.scope
            : colormaps[`${mapped}Map` as keyof ColorMap][color]
        ) as [];
        return (
          <>
            {values?.length &&
              values
                .filter((prop) =>
                  cleanString(prop).includes(cleanString(match)),
                )
                .map((el) => (
                  <div key={`${el}simple`}>
                    <PropertyItemModal
                      prop={el}
                      color={color}
                      type={mapped as Filter}
                      hasColorHint
                    />
                  </div>
                ))}
          </>
        );
      })}
    </>
  );
};

export default Accordion;
