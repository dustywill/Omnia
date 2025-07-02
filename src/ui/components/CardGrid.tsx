import React from 'react';

export type CardGridItem = {
  title: string;
  content: React.ReactNode;
};

type CardGridProps = {
  items: CardGridItem[];
};

export const CardGrid = ({ items }: CardGridProps) => {
  console.log(`[CardGrid] Rendering ${items.length} items:`, items.map(i => i.title));
  
  return (
    <div className="card-grid" role="grid">
      {items.map((item, idx) => {
        console.log(`[CardGrid] Rendering card ${idx}: ${item.title}`);
        console.log(`[CardGrid] Rendering content for ${item.title}:`, item.content);
        return (
          <article key={idx} className="card">
            <header>{item.title}</header>
            <div className="card-content">
              {item.content}
            </div>
          </article>
        );
      })}
    </div>
  );
};
