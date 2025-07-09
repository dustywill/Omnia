"use client";

import React, { useState, useCallback, useMemo } from "react";
// Removed @/lib/utils import for Electron compatibility

// Utility function for cn
function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Simple icon components to replace lucide-react
const ChevronRight = ({ className }: { className?: string }) => (
  <span className={cn("inline-block", className)} style={{ transform: 'rotate(0deg)', transition: 'transform 0.2s' }}>▶</span>
);

const Folder = ({ className }: { className?: string }) => (
  <span className={className}>📁</span>
);

const FolderOpen = ({ className }: { className?: string }) => (
  <span className={className}>📂</span>
);

const File = ({ className }: { className?: string }) => (
  <span className={className}>📄</span>
);

const Check = ({ className }: { className?: string }) => (
  <span className={className}>✓</span>
);

const Minus = ({ className }: { className?: string }) => (
  <span className={className}>−</span>
);

// Types
export type FileTreeNode = {
  id: string;
  name: string;
  type: "file" | "folder";
  children?: FileTreeNode[];
  data?: any;
};

export type SelectionState = "unchecked" | "checked" | "indeterminate";

export type FileTreeProps = {
  data: FileTreeNode[];
  className?: string;
  onNodeClick?: (node: FileTreeNode) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  defaultExpandedIds?: string[];
  defaultSelectedIds?: string[];
  showLines?: boolean;
  indent?: number;
  animateExpand?: boolean;
  /**
   * Tailwind CSS class for the folder icon color.
   * @example "text-blue-500"
   */
  folderIconColorClass?: string;
  /**
   * Tailwind CSS class for the file icon color.
   * @example "text-green-500"
   */
  fileIconColorClass?: string;
  /**
   * Tailwind CSS class for the background of each tree node.
   * Applied to the `motion.div` wrapping the node content.
   * @example "bg-gray-100"
   */
  nodeBgClass?: string;
  /**
   * Tailwind CSS class for the hover background of each tree node.
   * Applied to the `motion.div` wrapping the node content.
   * @example "hover:bg-gray-200"
   */
  nodeHoverBgClass?: string;
};

// Custom Checkbox component
const TreeCheckbox = React.forwardRef<
  HTMLButtonElement,
  {
    checked: SelectionState;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
  }
>(({ checked, onCheckedChange, className }, ref) => (
  <button
    ref={ref}
    type="button"
    role="checkbox"
    aria-checked={
      checked === "checked"
        ? true
        : checked === "indeterminate"
          ? "mixed"
          : false
    }
    className={cn(
      "peer size-4 shrink-0 rounded border border-input shadow-sm shadow-black/5 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:cursor-not-allowed disabled:opacity-50",
      checked === "checked" &&
        "border-primary bg-primary text-primary-foreground",
      checked === "indeterminate" &&
        "border-primary bg-primary text-primary-foreground",
      className,
    )}
    onClick={() => onCheckedChange(checked !== "checked")}
  >
    <div className="flex items-center justify-center text-current">
      {checked === "indeterminate" ? (
        <Minus className="h-3 w-3" />
      ) : checked === "checked" ? (
        <Check className="h-3 w-3" />
      ) : null}
    </div>
  </button>
));

TreeCheckbox.displayName = "TreeCheckbox";

// Main FileTree component
export function FileTree({
  data,
  className,
  onNodeClick,
  onSelectionChange,
  defaultExpandedIds = [],
  defaultSelectedIds = [],
  showLines = true,
  indent = 20,
  animateExpand = true,
  folderIconColorClass = "text-amber-500",
  fileIconColorClass = "text-blue-500",
  nodeBgClass,
  nodeHoverBgClass = "hover:bg-accent/50",
}: FileTreeProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(
    new Set(defaultExpandedIds),
  );
  const [selectedIds, setSelectedIds] = useState<Set<string>>(
    new Set(defaultSelectedIds),
  );

  // Get all descendant IDs for a node
  const getDescendantIds = useCallback((node: FileTreeNode): string[] => {
    const descendants: string[] = [];

    const traverse = (currentNode: FileTreeNode) => {
      descendants.push(currentNode.id);
      if (currentNode.children) {
        currentNode.children.forEach(traverse);
      }
    };

    if (node.children) {
      node.children.forEach(traverse);
    }

    return descendants;
  }, []);

  // Get all nodes in a flat structure for easier lookup
  const allNodes = useMemo(() => {
    const nodes = new Map<string, FileTreeNode>();

    const traverse = (node: FileTreeNode, parent?: FileTreeNode) => {
      nodes.set(node.id, { ...node, parent } as any);
      if (node.children) {
        node.children.forEach((child) => traverse(child, node));
      }
    };

    data.forEach((node) => traverse(node));
    return nodes;
  }, [data]);

  // Calculate selection state for a node
  const getSelectionState = useCallback(
    (node: FileTreeNode): SelectionState => {
      if (node.type === "file") {
        return selectedIds.has(node.id) ? "checked" : "unchecked";
      }

      // For folders, check children
      if (!node.children || node.children.length === 0) {
        return selectedIds.has(node.id) ? "checked" : "unchecked";
      }

      const descendantIds = getDescendantIds(node);
      const selectedDescendants = descendantIds.filter((id) =>
        selectedIds.has(id),
      );

      if (selectedDescendants.length === 0) {
        return "unchecked";
      } else if (selectedDescendants.length === descendantIds.length) {
        return "checked";
      } else {
        return "indeterminate";
      }
    },
    [selectedIds, getDescendantIds],
  );

  const toggleExpanded = useCallback((nodeId: string) => {
    setExpandedIds((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(nodeId)) {
        newSet.delete(nodeId);
      } else {
        newSet.add(nodeId);
      }
      return newSet;
    });
  }, []);

  const handleSelection = useCallback(
    (node: FileTreeNode, checked: boolean) => {
      setSelectedIds((prev) => {
        const newSet = new Set(prev);

        if (node.type === "file") {
          if (checked) {
            newSet.add(node.id);
          } else {
            newSet.delete(node.id);
          }
        } else {
          // For folders, select/deselect all descendants
          const descendantIds = getDescendantIds(node);
          descendantIds.push(node.id); // Include the folder itself

          if (checked) {
            descendantIds.forEach((id) => newSet.add(id));
          } else {
            descendantIds.forEach((id) => newSet.delete(id));
          }
        }

        const selectedArray = Array.from(newSet);
        onSelectionChange?.(selectedArray);
        return newSet;
      });
    },
    [getDescendantIds, onSelectionChange],
  );

  const renderNode = (
    node: FileTreeNode,
    level = 0,
    isLast = false,
    parentPath: boolean[] = [],
  ) => {
    const hasChildren =
      node.type === "folder" && (node.children?.length ?? 0) > 0;
    const isExpanded = expandedIds.has(node.id);
    const selectionState = getSelectionState(node);
    const currentPath = [...parentPath, isLast];

    const getIcon = () => {
      if (node.type === "file") {
        return <File className={cn("h-4 w-4", fileIconColorClass)} />;
      }
      return isExpanded ? (
        <FolderOpen className={cn("h-4 w-4", folderIconColorClass)} />
      ) : (
        <Folder className={cn("h-4 w-4", folderIconColorClass)} />
      );
    };

    return (
      <div key={node.id} className="select-none">
        <div
          className={cn(
            "flex items-center py-1 px-2 cursor-pointer transition-all duration-200 relative group rounded-md mx-1",
            nodeBgClass,
            nodeHoverBgClass,
          )}
          style={{ paddingLeft: level * indent + 8 }}
        >
          {/* Tree Lines */}
          {showLines && level > 0 && (
            <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
              {currentPath.map((isLastInPath, pathIndex) => (
                <div
                  key={pathIndex}
                  className="absolute top-0 bottom-0 border-l border-border/40"
                  style={{
                    left: pathIndex * indent + 12,
                    display:
                      pathIndex === currentPath.length - 1 && isLastInPath
                        ? "none"
                        : "block",
                  }}
                />
              ))}
              <div
                className="absolute top-1/2 border-t border-border/40"
                style={{
                  left: (level - 1) * indent + 12,
                  width: indent - 4,
                  transform: "translateY(-1px)",
                }}
              />
              {isLast && (
                <div
                  className="absolute top-0 border-l border-border/40"
                  style={{
                    left: (level - 1) * indent + 12,
                    height: "50%",
                  }}
                />
              )}
            </div>
          )}

          {/* Expand Icon */}
          <div
            className="flex items-center justify-center w-4 h-4 mr-1"
            style={{ 
              transform: hasChildren && isExpanded ? 'rotate(90deg)' : 'rotate(0deg)', 
              transition: 'transform 0.2s ease-in-out' 
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpanded(node.id);
            }}
          >
            {hasChildren && (
              <ChevronRight className="h-3 w-3 text-muted-foreground" />
            )}
          </div>

          {/* Checkbox */}
          <div className="mr-2" onClick={(e) => e.stopPropagation()}>
            <TreeCheckbox
              checked={selectionState}
              onCheckedChange={(checked) => handleSelection(node, checked)}
            />
          </div>

          {/* Node Icon */}
          <div
            className="flex items-center justify-center w-4 h-4 mr-2"
            onClick={() => {
              if (hasChildren) toggleExpanded(node.id);
              onNodeClick?.(node);
            }}
          >
            {getIcon()}
          </div>

          {/* Label */}
          <span
            className="text-sm font-medium truncate flex-1"
            onClick={() => {
              if (hasChildren) toggleExpanded(node.id);
              onNodeClick?.(node);
            }}
          >
            {node.name}
          </span>
        </div>

        {/* Children */}
        {hasChildren && isExpanded && (
          <div className="overflow-hidden">
            <div>
              {node.children!.map((child, index) =>
                renderNode(
                  child,
                  level + 1,
                  index === node.children!.length - 1,
                  currentPath,
                ),
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <motion.div
      className={cn(
        "w-full bg-background border border-border rounded-lg",
        className,
      )}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <div className="p-2">
        {data.map((node, index) =>
          renderNode(node, 0, index === data.length - 1),
        )}
      </div>
    </motion.div>
  );
}

// Demo component
function FileTreeDemo() {
  const treeData: FileTreeNode[] = [
    {
      id: "1",
      name: "src",
      type: "folder",
      children: [
        {
          id: "2",
          name: "components",
          type: "folder",
          children: [
            {
              id: "3",
              name: "ui",
              type: "folder",
              children: [
                { id: "4", name: "button.tsx", type: "file" },
                { id: "5", name: "input.tsx", type: "file" },
                { id: "6", name: "checkbox.tsx", type: "file" },
              ],
            },
            { id: "7", name: "header.tsx", type: "file" },
            { id: "8", name: "footer.tsx", type: "file" },
          ],
        },
        {
          id: "9",
          name: "pages",
          type: "folder",
          children: [
            { id: "10", name: "index.tsx", type: "file" },
            { id: "11", name: "about.tsx", type: "file" },
            {
              id: "12",
              name: "blog",
              type: "folder",
              children: [
                { id: "13", name: "post-1.tsx", type: "file" },
                { id: "14", name: "post-2.tsx", type: "file" },
              ],
            },
          ],
        },
        {
          id: "15",
          name: "utils",
          type: "folder",
          children: [
            { id: "16", name: "helpers.ts", type: "file" },
            { id: "17", name: "constants.ts", type: "file" },
          ],
        },
      ],
    },
    {
      id: "18",
      name: "public",
      type: "folder",
      children: [
        { id: "19", name: "favicon.ico", type: "file" },
        { id: "20", name: "logo.png", type: "file" },
      ],
    },
    { id: "21", name: "package.json", type: "file" },
    { id: "22", name: "README.md", type: "file" },
  ];

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-lg font-semibold mb-4">File Tree with Selection</h2>
      <FileTree
        data={treeData}
        defaultExpandedIds={["1", "2"]}
        onNodeClick={(node) => console.log("Clicked:", node.name)}
        onSelectionChange={(selectedIds) =>
          console.log("Selected:", selectedIds)
        }
        className="max-h-96 overflow-auto"
        // Example of custom styling
        folderIconColorClass="text-purple-500"
        fileIconColorClass="text-emerald-500"
        nodeBgClass="bg-card"
        nodeHoverBgClass="hover:bg-muted"
      />
    </div>
  );
}

export default FileTreeDemo;
