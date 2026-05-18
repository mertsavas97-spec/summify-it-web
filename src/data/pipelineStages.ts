import type { PipelineStage } from "@/core/types";

export type PipelineStageDefinition = {
  stage: PipelineStage;
  label: string;
  description: string;
};

export const pipelineStages: PipelineStageDefinition[] = [
  {
    stage: "upload",
    label: "Upload",
    description: "Ingest file metadata and queue processing.",
  },
  {
    stage: "extract",
    label: "Extract",
    description: "Parse PDF, DOCX, or text into raw content.",
  },
  {
    stage: "clean",
    label: "Clean",
    description: "Normalize text and remove noise.",
  },
  {
    stage: "profile",
    label: "Profile",
    description: "Build document profile for routing.",
  },
  {
    stage: "analyze",
    label: "Analyze",
    description: "Persona-based analysis via knowledge layer.",
  },
  {
    stage: "learn",
    label: "Learn",
    description: "Deferred flashcards and study assets.",
  },
];
