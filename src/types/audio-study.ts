export type AudioStudySection = {
  title: string;
  text: string;
};

export type AudioStudyScript = {
  title: string;
  durationEstimate: string;
  script: string;
  sections: AudioStudySection[];
};

export type AudioStudyMetadata = AudioStudyScript & {
  voice: string;
  generatedAt: string;
};

export type AudioStudyAnalysisInput = {
  title: string;
  summary: string;
  keyInsights: string[];
  risksOrWarnings?: string[];
  actionItems?: string[];
  learnCards?: Array<{
    title: string;
    type: string;
    content: string;
  }>;
  quizThemes?: string[];
  sourceType?: string | null;
  intelligenceMode?: string | null;
  sourceLabel?: string | null;
};
