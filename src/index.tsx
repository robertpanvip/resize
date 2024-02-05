import {
  useRef,
  forwardRef,
  useImperativeHandle,
  useState,
  useEffect,
} from "react";
import * as React from "react";
import classNames from "classnames";
import styles from "./index.module.scss";

export type ResizeType = "top" | "bottom" | "left" | "right";
type MinSize = { width: number; height: number };

export interface ResizeProps
  extends Omit<
    React.HTMLAttributes<HTMLDivElement>,
    "style" | "className" | "onResize"
  > {
  /**类名称**/
  className?: string;
  /**内联样式**/
  style?: React.CSSProperties;

  scrollbar?: {
    /**类名称**/
    className?: string;
    /**内联样式**/
    style?: React.CSSProperties;
    children?: React.ReactNode;
  };
  /**最外面包裹的元素默认是div**/
  is?: string;
  /**宽度和高度的最小值**/
  minSize?: Partial<MinSize> | number;
  /**哪些边允许调整**/
  type?: ResizeType | Array<ResizeType> | "all";
  /**调整尺寸中的回调**/
  onResize?: (e: MouseEvent) => void;
  /**调整尺寸完成后的回调**/
  onResizeEnd?: (rect: DOMRect) => void;

  children: React.ReactNode;
  /** */
  disabled?: boolean;
}

const defaultMinSize = { width: 0, height: 0 };
/**
 * 调整元素的宽高
 * @param className
 * @param style
 * @param minSize
 * @param type
 * @param children
 * @param onResizeEnd
 * @param onResize
 * @param is
 * @param scrollbar
 * @param exportRef
 * @constructor
 */
const Resize = (
  {
    className,
    style,
    minSize = defaultMinSize,
    type = "all",
    children,
    onResizeEnd,
    onResize,
    is = "div",
    scrollbar = {},
    disabled,
    ...rest
  }: ResizeProps,
  exportRef: React.Ref<HTMLDivElement | null>
) => {
  const ref = useRef<any>({});
  const drag = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState<{ width: number; height: number }>();

  useImperativeHandle(exportRef, () => drag.current);
  const _minSize: MinSize =
    typeof minSize == "object"
      ? { ...defaultMinSize, ...minSize }
      : { width: minSize, height: minSize };

  let _type: Array<ResizeType>;
  if (Array.isArray(type)) {
    _type = Array.from(new Set(type));
  } else if (type === "all") {
    _type = ["top", "bottom", "left", "right"];
  } else {
    _type = [type];
  }

  useEffect(() => {
    if (style) {
      if (style.width !== undefined || style.height !== undefined) {
        setSize(undefined);
      }
    }
  }, [style?.width, style?.height]);

  const handleMouseDown = (
    e: React.MouseEvent<HTMLDivElement>,
    direction: string
  ) => {
    const mouseDownTime = Date.now();
    const len =
      direction === "left" || direction === "right" ? "width" : "height";
    const isRightOrBottom = direction === "right" || direction === "bottom";
    const isWidth = len === "width";
    ref.current.cssText = document.body.style.cssText;

    document.body.style.userSelect = "none";
    document.body.style.cursor = isWidth ? "ew-resize" : "n-resize";

    ref.current.dragStart = isWidth ? e.clientX : e.clientY;

    const size = drag.current!.getBoundingClientRect()[len];
    const getDimension = (e: MouseEvent) => (isWidth ? e.clientX : e.clientY);

    const moveListener = (e: MouseEvent) => {
      const diff = getDimension(e) - ref.current.dragStart;
      const _size = isRightOrBottom ? size + diff : size - diff;
      if (_size > _minSize[len]) {
        drag.current!.style[len] = `${_size}px`;
      }
      onResize?.(e);
    };
    const upListener = (e: MouseEvent) => {
      document.removeEventListener("mousemove", moveListener);
      document.removeEventListener("mouseup", upListener);
      document.removeEventListener("drag", moveListener);
      document.removeEventListener("dragend", upListener);
      const diff = getDimension(e) - ref.current.dragStart;
      const _size = isRightOrBottom ? size + diff : size - diff;
      if (_size > _minSize[len]) {
        drag.current!.style[len] = `${_size}px`;
      }
      if (ref.current.cssText) {
        document.body.setAttribute("style", ref.current.cssText);
      } else {
        document.body.removeAttribute("style");
      }
      ref.current = {};
      const clientRect = drag.current!.getBoundingClientRect();

      if (Date.now() - mouseDownTime > 150) {
        setSize({
          width: clientRect.width,
          height: clientRect.height,
        });
        onResizeEnd?.(clientRect);
      }
    };
    document.addEventListener("mousemove", moveListener);
    document.addEventListener("mouseup", upListener);
    document.addEventListener("drag", moveListener);
    document.addEventListener("dragend", upListener);
  };
  return React.createElement(
    is,
    {
      ref: drag,
      style: {
        ...style,
        width:
          _type.includes("left") || _type.includes("right")
            ? size
              ? size.width
              : style?.width
            : undefined,
        height:
          _type.includes("top") || _type.includes("bottom")
            ? size
              ? size.height
              : style?.height
            : undefined,
      },
      className: classNames(styles.resize, className),
      ...rest,
    },
    <>
      {children}
      {_type.map((item) => {
        return (
          <div
            key={item}
            draggable="false"
            className={classNames(
              scrollbar.className,
              styles.drag,
              item === "left" && styles.left,
              item === "right" && styles.right,
              item === "top" && styles.top,
              item === "bottom" && styles.bottom,
              disabled && styles.disabled
            )}
            style={scrollbar.style}
            onMouseDown={(e) => !disabled && handleMouseDown(e, item)}
          >
            {scrollbar.children}
          </div>
        );
      })}
    </>
  );
};
export default forwardRef(Resize);
