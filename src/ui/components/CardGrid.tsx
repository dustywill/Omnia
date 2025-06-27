import React from 'react';
import './CardGrid.css';

export type CardGridItem = {
  title: string;
  content: React.ReactNode;
};

type CardGridProps = {
  items: CardGridItem[];
};

export const CardGrid = ({ items }: CardGridProps) => (
  <div className="card-grid" role="grid">
    {items.map((item, idx) => (
      <article key={idx} className="card">
        <header>{item.title}</header>
        <div className="card-content">{item.content}</div>
      </article>
    ))}
  </div>
);
