"use client";

import { useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

type ExactPrototypeCanvasProps = {
  children: ReactNode;
  width: number;
  height: number;
  frameClassName: string;
  canvasClassName: string;
};

export function ExactPrototypeCanvas({
  children,
  width,
  height,
  frameClassName,
  canvasClassName,
}: ExactPrototypeCanvasProps) {
  const frameRef = useRef<HTMLDivElement | null>(null);
  const [scale, setScale] = useState(1);
  const [ready, setReady] = useState(false);

  useLayoutEffect(() => {
    const element = frameRef.current;

    if (!element) {
      return;
    }

    const updateScale = () => {
      const nextScale = element.clientWidth / width;
      setScale(nextScale);
      setReady(true);
    };

    updateScale();

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    observer.observe(element);

    return () => {
      observer.disconnect();
    };
  }, [width]);

  const style = {
    "--prototype-canvas-width": `${width}px`,
    "--prototype-canvas-height": `${height}px`,
    "--prototype-canvas-scale": `${scale}`,
    "--prototype-canvas-ready": ready ? "1" : "0",
  } as CSSProperties;

  return (
    <div className={frameClassName} ref={frameRef} style={style}>
      <div className={canvasClassName}>{children}</div>
    </div>
  );
}
