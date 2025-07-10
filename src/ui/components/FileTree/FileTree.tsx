import React, { useState, useCallback } from "react";

// SVG Icon Components
const ChevronRight = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m9 18 6-6-6-6"/>
  </svg>
);

const Folder = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.9a2 2 0 0 1-1.69-.9L9.6 3.9A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>
  </svg>
);

const FolderOpen = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="m6 14 1.45-2.9A2 2 0 0 1 9.24 10H20a2 2 0 0 1 1.94 2.5l-1.55 6a2 2 0 0 1-1.94 1.5H4a2 2 0 0 1-2-2V5c0-1.1.9-2 2-2h3.93a2 2 0 0 1 1.66.9l.82 1.2a2 2 0 0 0 1.66.9H18a2 2 0 0 1 2 2v2"/>
  </svg>
);

const File = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    width="16" 
    height="16" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M15 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7Z"/>
    <path d="M14 2v4a2 2 0 0 0 2 2h4"/>
  </svg>
);

const Check = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M20 6 9 17l-5-5"/>
  </svg>
);

const Minus = ({ className }: { className?: string }) => (
  <svg 
    className={className} 
    width="12" 
    height="12" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round"
  >
    <path d="M5 12h14"/>
  </svg>
);

// Utility function for cn
function cn(...classes: (string | undefined | false)[]): string {
  return classes.filter(Boolean).join(" ");
}

// Types
export interface FileTreeNode {
  id: string;
  name: string;
  type: "file" | "folder";
  data?: any;
  children?: FileTreeNode[];
}

type CheckboxState = "checked" | "unchecked" | "indeterminate";

// Custom Checkbox component
const TreeCheckbox = React.forwardRef<
  HTMLButtonElement,
  {
    checked: CheckboxState;
    onCheckedChange: (checked: boolean) => void;
    className?: string;
  }
>(({ checked, onCheckedChange, className }, ref) => (
  <button
    ref={ref}
    type="button"
    role="checkbox"
    aria-checked={
      checked === "checked" ? true : checked === "indeterminate" ? "mixed" : false
    }
    className={cn(
      "peer size-4 shrink-0 rounded border border-input shadow-sm shadow-black/5 outline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-ring/70 disabled:cursor-not-allowed disabled:opacity-50",
      checked === "checked" && "border-primary bg-primary text-primary-foreground",
      checked === "indeterminate" && "border-primary bg-primary text-primary-foreground",
      className
    )}
    onClick={() => onCheckedChange(checked !== "checked")}
    style={{
      borderColor: checked === "checked" || checked === "indeterminate" ? "#007bff" : "#d1d5db",
      backgroundColor: checked === "checked" || checked === "indeterminate" ? "#007bff" : "transparent",
      color: checked === "checked" || checked === "indeterminate" ? "white" : "currentColor",
    }}
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

// Props for FileTree component
export interface FileTreeProps {
  data: FileTreeNode[];
  className?: string;
  onNodeClick?: (node: FileTreeNode) => void;
  onSelectionChange?: (selectedIds: string[]) => void;
  defaultExpandedIds?: string[];
  defaultSelectedIds?: string[];
  showLines?: boolean;
  indent?: number;
  folderIconColorClass?: string;
  fileIconColorClass?: string;
  nodeBgClass?: string;
  nodeHoverBgClass?: string;
}

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
  folderIconColorClass = "text-amber-500",
  fileIconColorClass = "text-blue-500",
  nodeBgClass,
  nodeHoverBgClass = "hover:bg-accent/50",
}: FileTreeProps) {
  const [expandedIds, setExpandedIds] = useState(new Set(defaultExpandedIds));
  const [selectedIds, setSelectedIds] = useState(new Set(defaultSelectedIds));

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

  // Get all nodes in a flat structure for easier lookup (currently unused but kept for future features)
  // const allNodes = useMemo(() => {
  //   const nodes = new Map<string, FileTreeNode & { parent?: FileTreeNode }>();
  //   const traverse = (node: FileTreeNode, parent?: FileTreeNode) => {
  //     nodes.set(node.id, { ...node, parent });
  //     if (node.children) {
  //       node.children.forEach((child) => traverse(child, node));
  //     }
  //   };
  //   data.forEach((node) => traverse(node));
  //   return nodes;
  // }, [data]);

  // Calculate selection state for a node
  const getSelectionState = useCallback((node: FileTreeNode): CheckboxState => {
    if (node.type === "file") {
      return selectedIds.has(node.id) ? "checked" : "unchecked";
    }
    
    // For folders, check children
    if (!node.children || node.children.length === 0) {
      return selectedIds.has(node.id) ? "checked" : "unchecked";
    }
    
    const descendantIds = getDescendantIds(node);
    const selectedDescendants = descendantIds.filter((id) => selectedIds.has(id));
    
    if (selectedDescendants.length === 0) {
      return "unchecked";
    } else if (selectedDescendants.length === descendantIds.length) {
      return "checked";
    } else {
      return "indeterminate";
    }
  }, [selectedIds, getDescendantIds]);

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

  const handleSelection = useCallback((node: FileTreeNode, checked: boolean) => {
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
  }, [getDescendantIds, onSelectionChange]);

  const renderNode = (node: FileTreeNode, level = 0, isLast = false, parentPath: boolean[] = []) => {
    const hasChildren = node.type === "folder" && (node.children?.length ?? 0) > 0;
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
            nodeHoverBgClass
          )}
          style={{ paddingLeft: level * indent + 8 }}
        >
          {/* Connection lines */}
          {showLines && level > 0 && (
            <div className="absolute left-0 top-0 bottom-0 pointer-events-none">
              {currentPath.map((isLastInPath, pathIndex) => (
                <div
                  key={pathIndex}
                  className="absolute top-0 bottom-0 border-l border-border/40"
                  style={{
                    left: pathIndex * indent + 12,
                    display: pathIndex === currentPath.length - 1 && isLastInPath ? "none" : "block",
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

          {/* Expand/collapse chevron */}
          <div
            className="flex items-center justify-center w-4 h-4 mr-1 transition-transform duration-200 ease-in-out"
            style={{ 
              transform: hasChildren && isExpanded ? "rotate(90deg)" : "rotate(0deg)" 
            }}
            onClick={(e) => {
              e.stopPropagation();
              if (hasChildren) toggleExpanded(node.id);
            }}
          >
            {hasChildren && <ChevronRight className="h-3 w-3 text-muted-foreground" />}
          </div>

          {/* Checkbox */}
          <div className="mr-2" onClick={(e) => e.stopPropagation()}>
            <TreeCheckbox
              checked={selectionState}
              onCheckedChange={(checked) => handleSelection(node, checked)}
            />
          </div>

          {/* Icon */}
          <div
            className="flex items-center justify-center w-4 h-4 mr-2 transition-transform duration-150 hover:scale-110"
            onClick={() => {
              if (hasChildren) toggleExpanded(node.id);
              onNodeClick?.(node);
            }}
          >
            {getIcon()}
          </div>

          {/* Node name */}
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
          <div 
            className="overflow-hidden transition-all duration-300 ease-in-out"
            style={{
              maxHeight: isExpanded ? "1000px" : "0",
              opacity: isExpanded ? 1 : 0,
            }}
          >
            <div className="transition-transform duration-200 ease-in-out">
              {node.children!.map((child, index) =>
                renderNode(child, level + 1, index === node.children!.length - 1, currentPath)
              )}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div 
      className={cn("w-full bg-background border border-border rounded-lg transition-all duration-300 ease-out", className)}
      style={{
        opacity: 1,
        transform: "translateY(0)",
      }}
    >
      <div className="p-2">
        {data.map((node, index) => renderNode(node, 0, index === data.length - 1))}
      </div>
    </div>
  );
}

export default FileTree;