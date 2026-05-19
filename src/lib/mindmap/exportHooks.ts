import type { MindMapExportOptions } from "@/types/mindmap";

/**
 * Future: rasterize the React Flow viewport to PNG.
 * Wire html-to-image or canvas snapshot in a later release.
 */
export async function exportMindMapPng(
  viewport: HTMLElement,
  options: MindMapExportOptions,
): Promise<Blob | null> {
  void viewport;
  void options;
  return null;
}

/** Future: serialize SVG from the graph DOM. */
export async function exportMindMapSvg(
  viewport: HTMLElement,
  options: MindMapExportOptions,
): Promise<string | null> {
  void viewport;
  void options;
  return null;
}

/** Future: PDF snapshot via print pipeline or headless render. */
export async function exportMindMapPdf(
  viewport: HTMLElement,
  options: MindMapExportOptions,
): Promise<Blob | null> {
  void viewport;
  void options;
  return null;
}
