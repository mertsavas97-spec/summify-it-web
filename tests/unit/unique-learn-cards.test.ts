import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { uniqueLearnCards } from "../../src/lib/learn/uniqueLearnCards";
import { filterValidLearnCards } from "../../src/lib/learn/learnCardValidation";
import { parseQuizContent, type LearnCardOutput } from "../../src/types/text-analysis";

function card(partial: Pick<LearnCardOutput, "type" | "title" | "content">): LearnCardOutput {
  return partial;
}

const deathArrow = card({
  type: "why_it_matters",
  title: "Mao's death on 9 September 1976 led to a power struggle that ultimately",
  content:
    "Mao's death on 9 September 1976 → a power struggle that ultimately elevated Deng Xiaoping, whose 1978 reforms shifted China toward market economics and lifted over 850 million people out of poverty by the mid-1990s",
});

const deathProse = card({
  type: "why",
  title: "Why did Mao's death on 9 September 1976 matter?",
  content:
    "Mao's death on 9 September 1976 led to a power struggle that ultimately elevated Deng Xiaoping, whose 1978 reforms shifted China toward market economics and lifted over 850 million people out of poverty by the mid-1990s.",
});

const massacre = card({
  type: "why_it_matters",
  title: "He joined the Chinese Communist Party and survived the 1927 Shanghai massacre",
  content:
    "He joined the Chinese Communist Party at its founding in 1921 and survived the 1927 Shanghai massacre, which marked the start of a 20-year civil war between the CCP and the Kuomintang.",
});

const longMarch = card({
  type: "concept",
  title: "The 1934-35 Long March",
  content:
    "The 1934-35 Long March, covering roughly 5,000 miles, elevated Mao to undisputed party leadership and solidified his strategic reputation.",
});

const cultural = card({
  type: "concept",
  title: "The Cultural Revolution",
  content:
    "The Cultural Revolution (1966-76) mobilized Red Guard youth to attack the four olds, resulting in mass killings, persecution of intellectuals, and a breakdown of social order.",
});

describe("unique learn cards", () => {
  it("keeps one why card when the same event is stored twice", () => {
    const unique = uniqueLearnCards([deathArrow, deathProse, massacre]);
    assert.equal(unique.length, 1);
    assert.equal(unique[0].title, deathProse.title);
    assert.equal(unique[0].type === "why" || unique[0].type === "why_it_matters", true);
    assert.match(unique[0].content, /Deng Xiaoping/);
  });

  it("drops a concept card that repeats a why card's sentence", () => {
    const concept = card({
      type: "concept",
      title: "Mao Zedong was born on 26 December 1893 in Hunan",
      content:
        "Mao Zedong was born on 26 December 1893 in Hunan and rejected an arranged marriage at age 14, signaling his early break with traditional Confucian norms.",
    });
    const why = card({
      type: "why_it_matters",
      title: "Why did this matter?",
      content: concept.content,
    });
    const unique = uniqueLearnCards([concept, why]);
    assert.equal(unique.length, 0);
  });

  it("keeps distinct concept facts", () => {
    const unique = uniqueLearnCards([longMarch, cultural]);
    assert.equal(unique.length, 2);
  });

  it("keeps one quiz when the question is repeated", () => {
    const quiz = card({
      type: "quiz",
      title: "When did the Long March happen?",
      content: "When did the Long March happen?\n---\nFrom 1934 to 1935.",
    });
    const unique = uniqueLearnCards([quiz, { ...quiz, title: "When did the Long March happen?" }]);
    assert.equal(unique.length, 1);
  });

  it("keeps the quiz answer delimiter intact so the card still validates", () => {
    const quiz = card({
      type: "quiz",
      title: "What share of Russian industry was handed to Germany in the 1918 treaty?",
      content:
        "What share of Russian industry was handed to Germany in the 1918 treaty?\n---\nBolshevik Russia ceded major industrial regions under the treaty.",
    });
    const unique = uniqueLearnCards([quiz]);
    assert.equal(unique.length, 1);

    const parsed = parseQuizContent(unique[0]!.content);
    assert.match(parsed.answer ?? "", /industrial regions/);
    // Without a preserved "\n---\n" the access filter drops every quiz card.
    assert.equal(filterValidLearnCards(unique, "test").length, 1);
  });
});
