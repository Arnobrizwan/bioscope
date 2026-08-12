import { describe, expect, it } from "vitest";
import {
  normalizeGbifOccurrence,
  normalizeSpeciesSearchResults,
} from "@/services/gbif.service";
import { normalizeNasaPowerResponse } from "@/services/nasa-power.service";

describe("provider adapters", () => {
  it("safely rejects unmappable GBIF records", () => {
    expect(
      normalizeGbifOccurrence({ key: 1, scientificName: "Taxon" }),
    ).toBeNull();
  });
  it("normalizes a complete GBIF record", () => {
    expect(
      normalizeGbifOccurrence({
        key: 1,
        scientificName: "Taxon",
        class: "Aves",
        decimalLatitude: 4,
        decimalLongitude: 102,
      })?.taxonomicGroup,
    ).toBe("birds");
  });
  it("prefers the GBIF backbone and collapses duplicate checklist taxa", () => {
    const results = normalizeSpeciesSearchResults(
      [
        {
          key: 104061167,
          scientificName: "Panthera tigris",
          canonicalName: "Panthera tigris",
          rank: "SPECIES",
          taxonomicStatus: "ACCEPTED",
          synonym: false,
          kingdom: "Metazoa",
          family: "Felidae",
        },
        {
          key: 5219416,
          nubKey: 5219416,
          scientificName: "Panthera tigris (Linnaeus, 1758)",
          canonicalName: "Panthera tigris",
          rank: "SPECIES",
          taxonomicStatus: "ACCEPTED",
          synonym: false,
          kingdom: "Animalia",
          family: "Felidae",
          vernacularNames: [{ vernacularName: "Tiger", language: "eng" }],
        },
        {
          key: 154499189,
          nubKey: 5219416,
          scientificName: "Panthera tigris (Linnaeus 1758)",
          canonicalName: "Panthera tigris",
          rank: "SPECIES",
          taxonomicStatus: "ACCEPTED",
          synonym: false,
          kingdom: "Animalia",
          family: "Felidae",
        },
        {
          key: 113393141,
          scientificName: "Panthera tigris (Linnaeus, 1758)",
          canonicalName: "Panthera tigris",
          rank: "SPECIES",
          taxonomicStatus: "ACCEPTED",
          synonym: false,
        },
      ],
      "Panthera tigris",
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      key: 5219416,
      scientificName: "Panthera tigris (Linnaeus, 1758)",
      vernacularName: "Tiger",
      isBackbone: true,
    });
  });
  it("keeps an exact common-name checklist match when no backbone mapping exists", () => {
    const results = normalizeSpeciesSearchResults(
      [
        {
          key: 104061174,
          scientificName: "Panthera tigris jacksoni",
          canonicalName: "Panthera tigris jacksoni",
          rank: "SUBSPECIES",
          taxonomicStatus: "ACCEPTED",
          synonym: false,
          kingdom: "Animalia",
          vernacularNames: [{ vernacularName: "Malayan tiger" }],
        },
        {
          key: 7059276,
          nubKey: 7059276,
          scientificName: "Panthera tigris tigris",
          canonicalName: "Panthera tigris tigris",
          rank: "SUBSPECIES",
          taxonomicStatus: "ACCEPTED",
          synonym: false,
          kingdom: "Animalia",
          vernacularNames: [{ vernacularName: "Bengal tiger" }],
        },
      ],
      "Malayan tiger",
    );

    expect(results[0]).toMatchObject({
      key: 104061174,
      vernacularName: "Malayan tiger",
      isBackbone: false,
    });
  });
  it("collapses checklist duplicates that omit a taxonomic rank", () => {
    const results = normalizeSpeciesSearchResults(
      [
        {
          key: 5219423,
          nubKey: 5219423,
          scientificName: "Panthera tigris virgata",
          canonicalName: "Panthera tigris virgata",
          rank: "SUBSPECIES",
          kingdom: "Animalia",
        },
        {
          key: 123,
          scientificName: "Panthera tigris virgata",
          canonicalName: "Panthera tigris virgata",
          kingdom: "Metazoa",
        },
      ],
      "Panthera tigris",
    );

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ key: 5219423, isBackbone: true });
  });
  it("averages NASA series and discards fill values", () => {
    const result = normalizeNasaPowerResponse(
      {
        properties: {
          parameter: { T2M: { a: 28, b: 30, c: -999 }, RH2M: { a: 80, b: 82 } },
        },
      },
      { start: "a", end: "b" },
    );
    expect(result.temperature).toBe(29);
    expect(result.humidity).toBe(81);
    expect(result.precipitation).toBeUndefined();
  });
});
