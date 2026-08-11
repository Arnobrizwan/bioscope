import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { IntelligencePanel } from "@/features/explorer/intelligence-panel";
import { locationIntelligenceFixture } from "../fixtures/location-intelligence";

describe("IntelligencePanel", () => {
  it("shows a scientifically labeled result", () => {
    render(
      <IntelligencePanel data={locationIntelligenceFixture} loading={false} />,
    );
    expect(screen.getByText("Species").nextSibling).toHaveTextContent("2");
    expect(screen.getByText("28.4 °C")).toBeInTheDocument();
    expect(
      screen.getByText(/Results are not exhaustive population data/),
    ).toBeInTheDocument();
  });
  it("announces the loading state", () => {
    render(<IntelligencePanel data={null} loading />);
    expect(
      screen.getByText(/Integrating GBIF and NASA POWER/),
    ).toBeInTheDocument();
  });
});
