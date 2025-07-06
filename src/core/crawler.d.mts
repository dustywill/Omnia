export type CrawlNode = {
  name: string;
  type: 'directory' | 'file' | 'error';
  path: string;
  error?: string;
  children: CrawlNode[];
};

export type CrawlOptions = {
  folderRegex?: string;
  folderFilterType?: 'include' | 'exclude';
  fileRegex?: string;
  fileFilterType?: 'include' | 'exclude';
  maxDepth?: number | null;
};

export function crawlDirectory(
  dirPath: string,
  options?: CrawlOptions,
  currentDepth?: number,
): Promise<CrawlNode | null>;
