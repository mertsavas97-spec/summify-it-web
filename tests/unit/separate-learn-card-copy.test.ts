import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  formatWhyCard,
  isPublishableStudyCard,
  repairStudyCard,
  separateLearnCardCopy,
} from "../../src/lib/learn/separateLearnCardCopy";

function endsClean(text: string): boolean {
  return !/(?:'s|\b(?:the|a|an|of|to|in|for|and|roughly|covering))\s*$/i.test(text) && !/\d$/.test(text);
}

describe("study card title and description", () => {
  it("rejoins a number cut so the description is the full fact", () => {
    const split = separateLearnCardCopy(
      "The 1934-35 Long March, covering roughly 5,000",
      "Miles, elevated Mao to undisputed party leadership and solidified his strategic reputation.",
    );
    assert.match(split.title, /Long March/);
    assert.match(split.title, /elevated/i);
    assert.equal(endsClean(split.title), true);
    assert.match(split.content, /5,000 miles/i);
    assert.match(split.content, /strategic reputation/i);
    assert.doesNotMatch(split.content, /^Miles,/);
  });

  it("keeps Red Guard youth together", () => {
    const split = separateLearnCardCopy(
      "The Cultural Revolution (1966-76) mobilized Red Guard",
      "Youth to attack the “four olds,” resulting in mass killings, persecution of intellectuals, and a breakdown of social order.",
    );
    assert.match(split.title, /Red Guard youth/i);
    assert.match(split.content, /four olds/i);
    assert.match(split.content, /social order/i);
    assert.doesNotMatch(split.content, /^Youth/);
  });

  it("does not leave a possessive tail as the title", () => {
    const split = separateLearnCardCopy(
      "Following Mao's death in 1976, Deng Xiaoping's",
      "Reforms from 1978 onward de-collectivized agriculture, attracted foreign investment, and drove China's GDP to quadruple by the mid-1990s.",
    );
    assert.match(split.title, /Deng Xiaoping/i);
    assert.match(split.title, /reform/i);
    assert.equal(/'s$/.test(split.title), false);
    assert.match(split.content, /de-collectivized agriculture/i);
    assert.doesNotMatch(split.content, /^Reforms/);
  });

  it("turns a But-continuation into a complete description", () => {
    const split = separateLearnCardCopy(
      "The 1911 revolution abolished the monarchy",
      "But the resulting Republic of China failed to meet Mao's expectations, prompting his turn toward radical politics.",
    );
    assert.equal(split.title, "The 1911 revolution abolished the monarchy");
    assert.match(split.content, /^The resulting Republic of China failed/);
    assert.doesNotMatch(split.content, /^But\b/);
  });

  it("keeps an elliptical second clause inside the full description", () => {
    const full =
      "Internationally, Mao sent troops to the Korean War but later broke with the USSR after Khrushchev's de-Stalinization.";
    const split = separateLearnCardCopy(
      "Internationally, Mao sent troops to the Korean War",
      "But later broke with the USSR after Khrushchev's de-Stalinization.",
    );
    assert.match(split.title, /Korean War/);
    assert.equal(endsClean(split.title), true);
    assert.match(split.content, /broke with the USSR/i);
    assert.match(split.content, /Korean War/);
    assert.equal(split.content.includes(full.slice(0, 40)) || split.content.includes("broke with the USSR"), true);
  });

  it("replaces a vague change question with the fact itself", () => {
    const birth =
      'Mao Zedong was born on December 26, 1893, in Hunan province during China\'s "century of humiliation," a period marked by foreign invasions, unequal treaties, and the collapse of the Qing dynasty.';
    const split = separateLearnCardCopy("What changed after this event?", birth);
    assert.doesNotMatch(split.title, /what changed after/i);
    assert.match(split.title, /Mao Zedong was born/i);
    assert.match(split.content, /unequal treaties/i);
  });

  it("drops a documentary overview label and a source-title question", () => {
    const split = separateLearnCardCopy(
      "What changed after Story of Chairman Mao?",
      'The Real Story of Chairman Mao – Documentary Overview Mao Zedong was born on December 26, 1893, in Hunan province during China\'s "century of humiliation," a period marked by foreign invasions, unequal treaties, and the collapse of the Qing dynasty.',
    );
    assert.doesNotMatch(split.title, /what changed after/i);
    assert.doesNotMatch(split.content, /Documentary Overview/i);
    assert.match(split.content, /Mao Zedong was born/i);
  });

  it("leaves a short complete card alone", () => {
    const split = separateLearnCardCopy(
      "The 1911 revolution abolished the monarchy",
      "The republic that followed never met Mao's expectations.",
    );
    assert.equal(split.title, "The 1911 revolution abolished the monarchy");
    assert.match(split.content, /never met Mao's expectations/);
  });

  it("does not rewrite quiz cards", () => {
    const split = separateLearnCardCopy(
      "How long did the Chinese Civil War last?",
      "How long did the Chinese Civil War last?\n---\nFrom 1927 until 1949.",
    );
    assert.match(split.content, /\n---\n/);
  });
});

describe("why card questions", () => {
  it("asks why a dated cause mattered and writes the chain in prose", () => {
    const card = formatWhyCard(
      "Mao's death on 9 September 1976 led to a power struggle that ultimately",
      "Mao's death on 9 September 1976 → a power struggle that ultimately elevated Deng Xiaoping, whose 1978 reforms shifted China toward market economics and lifted over 850 million people out of poverty by the mid-1990s",
    );
    assert.equal(card.title, "Why did Mao's death on 9 September 1976 matter?");
    assert.doesNotMatch(card.title, /ultimately/i);
    assert.match(card.content, /led to a power struggle/i);
    assert.match(card.content, /850 million/);
    assert.doesNotMatch(card.content, /→/);
  });

  it("asks about the significance instead of the birth clause", () => {
    const card = formatWhyCard(
      "Mao Zedong was born on 26 December 1893 in Hunan",
      "Mao Zedong was born on 26 December 1893 in Hunan and rejected an arranged marriage at age 14, signaling his early break with traditional Confucian norms.",
    );
    assert.match(card.title, /^Why did Mao Zedong's /);
    assert.match(card.title, /Confucian norms/);
    assert.doesNotMatch(card.title, /in Hunan/);
    assert.match(card.content, /arranged marriage/);
    assert.match(card.content, /1893/);
  });

  it("asks about the named event instead of a pronoun clause", () => {
    const card = formatWhyCard(
      "He joined the Chinese Communist Party at its founding in 1921 and survived the 1927 Shanghai massacre",
      "He joined the Chinese Communist Party at its founding in 1921 and survived the 1927 Shanghai massacre, which marked the start of a 20-year civil war between the CCP and the Kuomintang.",
    );
    assert.equal(card.title, "Why did the 1927 Shanghai massacre matter?");
    assert.doesNotMatch(card.title, /^He\b/);
    assert.match(card.content, /civil war/);
  });

  it("uses the same question shape for a business claim", () => {
    const card = formatWhyCard(
      "The new pricing model raised monthly fees",
      "The new pricing model raised monthly fees, which reduced churn among annual subscribers.",
    );
    assert.equal(card.title, "Why did the new pricing model matter?");
    assert.match(card.content, /reduced churn/);
  });

  it("uses the same question shape for a technical claim", () => {
    const card = formatWhyCard(
      "A missing index slowed every report",
      "A missing index slowed every report because the query scanned the full table.",
    );
    assert.equal(card.title, "Why did a missing index matter?");
    assert.match(card.content, /full table/);
  });

  it("keeps a question that the answer already explains", () => {
    const card = formatWhyCard(
      "Why did the treaty fail?",
      "The treaty failed because enforcement was left to local courts without a shared deadline.",
    );
    assert.ok(card);
    assert.equal(card.title, "Why did the treaty fail?");
    assert.match(card.content, /enforcement/);
  });

  it("drops date fragments and summary restatements instead of inventing a why question", () => {
    assert.equal(
      formatWhyCard(
        "Early 1970s",
        "Early 1970s: Death toll estimates rise to thousands or possibly millions.",
      ),
      null,
    );
    assert.equal(
      formatWhyCard(
        "26 December 1966",
        "26 December 1966: Mao issues an all-round civil war call.",
      ),
      null,
    );
    assert.equal(
      isPublishableStudyCard(
        "why",
        "Why did a nuclear matter?",
        "1960s: China emerges as a nuclear-armed world power with massive human and economic potential.",
      ),
      false,
    );
    assert.equal(
      isPublishableStudyCard(
        "why",
        "Why did the scale of violence matter?",
        "1967: Red Guard campaigns result in roughly 250,000 deaths, illustrating the scale of violence.",
      ),
      false,
    );
  });

  it("keeps a finished question whose fact ends in a year", () => {
    const card = repairStudyCard(
      "concept",
      "In which revolutionary force did Mao Zedong serve in 1911?",
      "He joined the 1911 revolutionary army.",
    );
    assert.ok(card);
    assert.match(card.title, /1911\?$/);
    assert.match(card.content, /revolutionary army/);
    assert.equal(card.content.includes(card.title), false);
  });

  it("keeps a finished question whose subject ends with a year", () => {
    const card = repairStudyCard(
      "concept",
      "In which revolutionary force did Mao Zedong serve in 1911?",
      "He joined the 1911 revolutionary army.",
    );
    assert.ok(card);
    assert.match(card.title, /1911\?$/);
    assert.match(card.content, /revolutionary army/);
    assert.equal(card.content.toLowerCase().startsWith("in which"), false);
  });

  it("does not mint a What-followed question from a raw sentence", () => {
    assert.equal(
      repairStudyCard(
        "connection",
        "Yet the preceding decade's policy missteps sowed deep social strain",
        "Yet the preceding decade's policy missteps sowed deep social strain, setting the stage for Mao Zedong's radical campaign.",
      ),
      null,
    );
    assert.equal(
      repairStudyCard(
        "concept",
        "What followed the revolutionary army and later?",
        "1911 – Mao enlists in the revolutionary army and later co-founds the Chinese Communist Party.",
      ),
      null,
    );
    assert.equal(
      repairStudyCard(
        "concept",
        "What did Mao Zedong change here?",
        "1893 – Mao Zedong is born in Hunan during the late Qing era.",
      ),
      null,
    );
    assert.equal(
      repairStudyCard(
        "connection",
        "How Do the Main Forces in This Narrative Interact?",
        "Mao Zedong: Rise, Revolution, and the Cultural Revolution ↔ A Historical Overview",
      ),
      null,
    );
  });

  it("does not keep a question that was cut off mid-word", () => {
    const card = repairStudyCard(
      "connection",
      "What tension does “The movement escalated into a decade of struggle sess",
      "The movement escalated into a decade of struggle sessions, mass torture, and executions.",
    );
    if (card) {
      assert.match(card.title, /\?$/);
      assert.doesNotMatch(card.title, /sess$/i);
      assert.match(card.content, /The movement escalated/i);
      assert.match(card.content, /executions/i);
    } else {
      assert.equal(card, null);
    }
  });

  it("drops a link whose title is the cut-off start of the answer", () => {
    const title =
      "September 1976: Mao dies; his successor Hua Guofeng pledges to uphold all Mao directives while beginning";
    const body =
      "September 1976: Mao dies; his successor Hua Guofeng pledges to uphold all Mao directives while beginning a covert campaign against the Gang of Four.";
    assert.equal(isPublishableStudyCard("connection", title, body), false);
    assert.equal(
      isPublishableStudyCard(
        "memory_hook",
        "Gang of Four",
        "Key turning point → institutional pressure → public response.",
      ),
      false,
    );
  });
});
