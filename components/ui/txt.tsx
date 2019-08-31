import classnames from "classnames";
import React, { HTMLAttributes, ReactNode } from "react";

export enum TxtSize {
  SMALL = "small",
  MEDIUM = "medium",
  LARGE = "large"
}

const TxtClasses = {
  [TxtSize.SMALL]: "f7",
  [TxtSize.MEDIUM]: "f4",
  [TxtSize.LARGE]: "ttu f2 tracked"
};

interface Props extends HTMLAttributes<HTMLSpanElement> {
  italic?: boolean;
  uppercase?: boolean;
  multiline?: boolean;
  size?: TxtSize;
  value?: ReactNode;
}

export default function Txt(props: Props) {
  const {
    size = TxtSize.SMALL,
    italic = false,
    uppercase = false,
    multiline = false,
    value: content,
    children,
    className,
    ...attributes
  } = props;

  return (
    <span
      className={classnames(
        TxtClasses[size],
        { ttu: uppercase },
        { i: italic },
        { pre: multiline },
        className
      )}
      {...attributes}
    >
      {content !== undefined ? content : children}
    </span>
  );
}
