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
  
  const gridStyle: React.CSSProperties = {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
    gap: '1rem',
    fontFamily: "'Nunito Sans', sans-serif",
    padding: '1rem'
  };

  const cardStyle: React.CSSProperties = {
    backgroundColor: '#ffffff',
    color: '#333333',
    border: '1px solid #e0e0e0',
    borderRadius: '4px',
    padding: '1rem',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  };

  const headerStyle: React.CSSProperties = {
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    fontSize: '1.1rem',
    color: '#2c3e50'
  };
  
  return (
    <div style={gridStyle} role="grid">
      {items.map((item, idx) => {
        console.log(`[CardGrid] Rendering card ${idx}: ${item.title}`);
        console.log(`[CardGrid] Rendering content for ${item.title}:`, item.content);
        return (
          <article key={idx} style={cardStyle}>
            <header style={headerStyle}>{item.title}</header>
            <div>
              {item.content}
            </div>
          </article>
        );
      })}
    </div>
  );
};
