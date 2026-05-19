/** Concept node importance for visual hierarchy. */
export type MindMapNodeImportance = "primary" | "secondary" | "tertiary";

/** Semantic node role in the graph. */
export type MindMapNodeType =
  | "root"
  | "theme"
  | "concept"
  | "insight"
  | "action"
  | "risk"
  | "obligation"
  | "evidence"
  | "topic"
  | "timeline"
  | "dependency"
  | "learn";

export type MindMapNodeMetadata = {
  confidence?: number;
  importance?: MindMapNodeImportance;
  type: MindMapNodeType;
  /** Optional link to learn card index or insight index */
  sourceIndex?: number;
};

export type MindMapNode = {
  id: string;
  title: string;
  /** Short insight line shown on the card */
  insight?: string;
  groupId?: string;
  parentId?: string | null;
  metadata: MindMapNodeMetadata;
};

export type MindMapEdge = {
  id: string;
  source: string;
  target: string;
  /** visual / semantic relationship */
  kind?: "hierarchy" | "relation" | "dependency" | "timeline";
  label?: string;
};

export type MindMapGroup = {
  id: string;
  label: string;
  /** Layout hint for cluster positioning */
  position?: "north" | "south" | "east" | "west" | "center";
};

export type MindMapGraph = {
  version: 1;
  profile: MindMapGraphProfile;
  title: string;
  nodes: MindMapNode[];
  edges: MindMapEdge[];
  groups: MindMapGroup[];
  generatedAt: string;
};

export type MindMapGraphProfile =
  | "meeting"
  | "research"
  | "educational"
  | "contract"
  | "narrative"
  | "general";

export type MindMapGenerationInput = {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings: string[];
  actionItems: string[];
  learnCards: Array<{ type: string; title: string; content: string }>;
  documentTypeGuess?: string | null;
  sourceKind?: string | null;
  intelligenceMode?: string | null;
};

export type MindMapGenerationResult =
  | { ok: true; graph: MindMapGraph }
  | { ok: false; reason: string };

/** Future export hooks — not implemented in 9B. */
export type MindMapExportFormat = "png" | "svg" | "pdf";

export type MindMapExportOptions = {
  format: MindMapExportFormat;
  /** Target pixel width for raster exports */
  width?: number;
  background?: string;
};
