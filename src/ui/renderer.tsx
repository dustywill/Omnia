import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { useEffect, useRef } from 'react';
import { CardGrid, type CardGridItem } from './components/CardGrid.js';
import { loadPluginUI } from './plugin-ui-loader.js';

export type RendererPlugin = {
  id: string;
  title: string;
  props?: Record<string, unknown>;
};

export type RendererOptions = {
  container: HTMLElement;
  pluginsPath: string;
  plugins: RendererPlugin[];
};

const PluginPanel: React.FC<{
  id: string;
  pluginsPath: string;
  props?: Record<string, unknown>;
}> = ({ id, pluginsPath, props }) => {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (ref.current) {
      loadPluginUI(id, { container: ref.current, pluginsPath, props }).catch(() => {});
    }
  }, [id, pluginsPath, props]);
  return <div ref={ref} />;
};

export const initRenderer = (
  opts: RendererOptions,
): Root => {
  const items: CardGridItem[] = opts.plugins.map((p) => ({
    title: p.title,
    content: React.createElement(PluginPanel, {
      id: p.id,
      pluginsPath: opts.pluginsPath,
      props: p.props,
    }),
  }));

  const root = createRoot(opts.container);
  root.render(React.createElement(CardGrid, { items }));
  return root;
};
