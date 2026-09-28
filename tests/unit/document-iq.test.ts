import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calculateDocumentIq } from "../../src/lib/documentIq/calculateDocumentIq";

const places = ["Hunan", "Yan'an", "Shanghai", "Guangdong", "Sichuan", "Beijing", "Nanjing", "Wuhan"];
const subjects = [
  "land reform",
  "the Long March",
  "grain procurement",
  "backyard furnaces",
  "Red Guard factions",
  "rural clinics",
  "literacy classes",
  "price controls",
  "township factories",
  "border garrisons",
  "party schools",
  "famine reports",
];

function documentary(): string {
  return Array.from({ length: 36 }, (_, index) => {
    const place = places[index % places.length];
    const subject = subjects[index % subjects.length];
    return `Narrator ${index + 1} in ${place} describes ${subject} during ${1940 + index}, when cadres, teachers, and soldiers argued about harvests, schools, and military supply.`;
  }).join("\n");
}

function chapter(): string {
  return Array.from({ length: 8 }, (_, index) => {
    const subject = subjects[index];
    return `Section ${index + 1}. This passage defines ${subject}, gives a dated example from ${places[index]}, and contrasts the outcome with the earlier policy. A reader can follow the claim without a separate glossary.`;
  }).join("\n\n");
}

describe("document iq readiness", () => {
  it("scores a varied lecture above the moderate band", () => {
    const iq = calculateDocumentIq({
      extractedText: documentary(),
      metadata: { sourceKind: "youtube" },
    });
    assert.ok(iq.iqScore >= 62, `lecture score ${iq.iqScore} r${iq.readability} c${iq.complexity} d${iq.density} a${iq.actionability}`);
    assert.ok(iq.iqScore <= 88, `lecture score ${iq.iqScore}`);
    assert.equal(iq.detectedDocumentType.type, "Video Transcript");
  });

  it("scores a structured chapter as ready to analyze", () => {
    const iq = calculateDocumentIq({
      extractedText: chapter(),
      metadata: { sourceKind: "pdf", fileType: "pdf" },
    });
    assert.ok(iq.iqScore >= 60, `chapter score ${iq.iqScore}`);
    assert.ok(iq.readability >= 60);
  });

  it("keeps a repeated stub well below a real source", () => {
    const repeated = calculateDocumentIq({
      extractedText: "hello hello hello this is a note ".repeat(40),
    });
    const lecture = calculateDocumentIq({
      extractedText: documentary(),
      metadata: { sourceKind: "youtube" },
    });
    assert.ok(repeated.iqScore < 45, `stub score ${repeated.iqScore}`);
    assert.ok(lecture.iqScore - repeated.iqScore >= 20);
  });
});
