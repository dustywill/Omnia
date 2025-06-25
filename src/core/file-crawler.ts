import { crawlDirectory, type CrawlNode } from './crawler.js';
import type { FileNode } from '../ui/components/FileScanner.js';

const toFileNode = (node: CrawlNode): FileNode => ({
  name: node.name,
  path: node.path,
  isDirectory: node.type === 'directory',
  children: node.children?.map(toFileNode),
});

export const getFileTree = async (dir: string): Promise<FileNode[]> => {
  const root = await crawlDirectory(dir);
  if (!root) return [];
  return root.children.map(toFileNode);
};
