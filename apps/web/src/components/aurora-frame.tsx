import type { ReactNode } from "react";

type AuroraFrameProps = {
  children: ReactNode;
};

export function AuroraFrame({ children }: AuroraFrameProps) {
  return (
    <main className="gallery">
      <section className="board board-d">
        <div className="aurora aurora-d1" />
        <div className="aurora aurora-d2" />
        <div className="aurora aurora-d3" />
        {children}
      </section>
    </main>
  );
}
