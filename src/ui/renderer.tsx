import React from 'react';
import { createRoot, type Root } from 'react-dom/client';
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
  const [error, setError] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  
  console.log(`[PluginPanel] Rendering plugin panel for: ${id}`);
  
  // Store the loaded plugin root so we can move it to the visible container
  const [pluginRoot, setPluginRoot] = React.useState<any>(null);

  // Use a callback ref instead of useRef to ensure we get called when the DOM element is available
  const refCallback = React.useCallback((element: HTMLDivElement | null) => {
    console.log(`[PluginPanel] Ref callback triggered for ${id}, element:`, element);
    if (element && loading) {
      console.log(`[PluginPanel] Element is available, starting plugin load for ${id}`);
      setError(null);
      loadPluginUI(id, { container: element, pluginsPath, props })
        .then((root) => {
          console.log(`[PluginPanel] Plugin ${id} loaded successfully`);
          setPluginRoot(root);
          setLoading(false);
        })
        .catch((err) => {
          console.error(`[PluginPanel] Failed to load plugin ${id}:`, err);
          setError(err.message);
          setLoading(false);
        });
    } else {
      console.log(`[PluginPanel] Element is null for ${id} or not loading`);
    }
  }, [id, pluginsPath, props, loading]);

  // Callback for the visible container when loading is complete
  const visibleRefCallback = React.useCallback((element: HTMLDivElement | null) => {
    if (element && pluginRoot && !loading) {
      console.log(`[PluginPanel] Moving plugin ${id} to visible container`);
      // Move the plugin content to the visible container
      while (element.firstChild) {
        element.removeChild(element.firstChild);
      }
      // Re-render the plugin in the visible container
      loadPluginUI(id, { container: element, pluginsPath, props })
        .then(() => {
          console.log(`[PluginPanel] Plugin ${id} moved to visible container successfully`);
        })
        .catch((err) => {
          console.error(`[PluginPanel] Failed to move plugin ${id}:`, err);
        });
    }
  }, [id, pluginsPath, props, pluginRoot, loading]);
  
  if (error) {
    return <div style={{ color: 'red', padding: '10px' }}>
      <strong>Plugin Error:</strong> {error}
    </div>;
  }
  
  if (loading) {
    console.log(`[PluginPanel] Rendering loading state for ${id}`);
    return (
      <div style={{ padding: '10px', textAlign: 'center' }}>
        Loading {id}...
        {/* Hidden container that triggers plugin loading */}
        <div ref={refCallback} style={{ display: 'none' }} />
      </div>
    );
  }
  
  console.log(`[PluginPanel] Rendering visible container for ${id}`);
  return <div ref={visibleRefCallback} />;
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
