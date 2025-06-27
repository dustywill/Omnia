import { screen, act } from '@testing-library/react';
import path from 'path';
import { initRenderer } from '../../src/ui/renderer.js';

it('initializes card grid and loads plugin UI', async () => {
  const container = document.createElement('div');
  document.body.appendChild(container);
  const pluginsPath = path.join(__dirname, '..', '..', 'plugins');
  await act(async () => {
    initRenderer({
      container,
      pluginsPath,
      plugins: [
        {
          id: 'context-generator',
          title: 'Context Generator',
          props: { tree: [] },
        },
      ],
    });
  });
  expect(screen.getByText('Context Generator')).toBeInTheDocument();
  expect(
    screen.getByRole('button', { name: /generate context/i }),
  ).toBeInTheDocument();
});
