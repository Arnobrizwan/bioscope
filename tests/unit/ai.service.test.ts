import { describe, expect, it } from "vitest";
import { createAIProvider } from "@/services/ai.service";
import { buildFieldBriefInput } from "@/lib/build-field-brief-input";
import { locationIntelligenceFixture } from "../fixtures/location-intelligence";

describe("AI field briefs", () => {
  it("constructs compact input without occurrences", () => {
    const input = buildFieldBriefInput(locationIntelligenceFixture);
    expect(input.topSpecies).toHaveLength(2);
    expect(input).not.toHaveProperty("occurrences");
  });
  it("labels the deterministic fallback", async () => {
    const previous = process.env.AI_API_KEY;
    delete process.env.AI_API_KEY;
    const brief = await createAIProvider().generateFieldBrief(
      buildFieldBriefInput(locationIntelligenceFixture),
    );
    expect(brief.mode).toBe("deterministic-demo");
    expect(brief.sections.dataLimitations).toContain("sampling bias");
    process.env.AI_API_KEY = previous;
  });
});
