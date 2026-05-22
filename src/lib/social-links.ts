/** Official Summify social profiles for footer and structured data. */
export const SUMMIFY_SOCIAL_LINKS = {
  twitter: "https://twitter.com/summify_app",
  linkedIn: "http://linkedin.com/company/summifyapp/",
} as const;

export const SUMMIFY_SOCIAL_SAME_AS = [
  SUMMIFY_SOCIAL_LINKS.twitter,
  SUMMIFY_SOCIAL_LINKS.linkedIn,
] as const;
