export type LearningExperienceId = "summary-learn" | "audio" | "podcast";

export const LEARNING_EXPERIENCE_OPTIONS: {
  id: LearningExperienceId;
  title: string;
  description: string;
  chips: string[];
}[] = [
  {
    id: "summary-learn",
    title: "AI Summary & Learn",
    description:
      "Structured AI summary and key insights first — then flashcards and quiz to lock it in.",
    chips: ["AI summary", "Key insights", "Flashcards", "Quiz"],
  },
  {
    id: "audio",
    title: "Audio lesson",
    description: "Turn your summary into a teacher-style audio lesson you can listen anywhere.",
    chips: ["Listen", "On the go"],
  },
  {
    id: "podcast",
    title: "Podcast",
    description: "Two AI hosts discuss the summary in a natural conversation.",
    chips: ["Two hosts", "Conversation"],
  },
];
