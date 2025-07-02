import React from 'react';

export const TestSimple: React.FC = () => {
  return (
    <div style={{ padding: '20px', border: '1px solid #ccc', margin: '10px' }}>
      <h2>🎉 Test Plugin Loaded Successfully!</h2>
      <p>This is a simple test plugin to verify the loading system works.</p>
      <button onClick={() => alert('Plugin interaction works!')}>
        Click me!
      </button>
    </div>
  );
};