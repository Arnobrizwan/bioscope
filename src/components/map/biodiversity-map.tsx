"use client";

import { useEffect, useRef } from "react";
import {
  AttributionControl,
  LngLatBounds,
  Map,
  Marker,
  NavigationControl,
  Popup,
  type MapMouseEvent,
  type StyleSpecification,
} from "maplibre-gl";
import type { LocationCoordinates, OccurrenceRecord } from "@/types/domain";

interface Props {
  selected: LocationCoordinates;
  occurrences?: OccurrenceRecord[];
  onSelect?: (location: LocationCoordinates) => void;
  className?: string;
}

// A small inline raster style avoids depending on remote style, sprite, glyph,
// and TileJSON documents. CARTO's no-key basemap is backed by OpenStreetMap and
// renders Malaysia reliably for this technical prototype.
const MAP_STYLE: StyleSpecification = {
  version: 8,
  sources: {
    carto: {
      type: "raster",
      tiles: ["https://basemaps.cartocdn.com/light_all/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>',
    },
  },
  layers: [{ id: "carto", type: "raster", source: "carto" }],
};

function addOccurrenceMarker(map: Map, record: OccurrenceRecord): Marker {
  const element = document.createElement("button");
  element.type = "button";
  element.className = "bioscope-occurrence-marker";
  element.setAttribute(
    "aria-label",
    `${record.scientificName} occurrence marker`,
  );
  element.title = record.commonName
    ? `${record.scientificName} — ${record.commonName}`
    : record.scientificName;
  element.addEventListener("click", (event) => event.stopPropagation());

  const content = document.createElement("div");
  const name = document.createElement("strong");
  const detail = document.createElement("span");
  name.textContent = record.scientificName;
  name.style.fontStyle = "italic";
  detail.textContent = record.commonName || record.taxonomicGroup;
  content.append(name, document.createElement("br"), detail);

  return new Marker({ element, anchor: "center" })
    .setLngLat([record.longitude, record.latitude])
    .setPopup(
      new Popup({ offset: 12, closeButton: false }).setDOMContent(content),
    )
    .addTo(map);
}

export default function BiodiversityMap({
  selected,
  occurrences = [],
  onSelect,
  className,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<Map | null>(null);
  const markerRef = useRef<Marker | null>(null);
  const occurrenceMarkersRef = useRef<Marker[]>([]);
  const onSelectRef = useRef(onSelect);
  const hasFitOccurrencesRef = useRef(false);
  const initialLocationRef = useRef(selected);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;
    const map = new Map({
      container: containerRef.current,
      style: MAP_STYLE,
      center: [
        initialLocationRef.current.longitude,
        initialLocationRef.current.latitude,
      ],
      // Start at survey scale so nearby occurrence clusters do not collapse
      // underneath the selected-location pin before the first bounds fit.
      zoom: 10,
      attributionControl: false,
    });
    map.addControl(new NavigationControl({ showCompass: true }), "top-right");
    map.addControl(new AttributionControl({ compact: true }), "bottom-right");
    const marker = new Marker({
      color: "#065f46",
      draggable: Boolean(onSelectRef.current),
    })
      .setLngLat([
        initialLocationRef.current.longitude,
        initialLocationRef.current.latitude,
      ])
      .addTo(map);
    marker.on("dragend", () => {
      const point = marker.getLngLat();
      onSelectRef.current?.({ latitude: point.lat, longitude: point.lng });
    });
    map.on("click", (event: MapMouseEvent) =>
      onSelectRef.current?.({
        latitude: event.lngLat.lat,
        longitude: event.lngLat.lng,
      }),
    );
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      for (const occurrenceMarker of occurrenceMarkersRef.current) {
        occurrenceMarker.remove();
      }
      marker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    hasFitOccurrencesRef.current = false;
    markerRef.current?.setLngLat([selected.longitude, selected.latitude]);
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    for (const occurrenceMarker of occurrenceMarkersRef.current) {
      occurrenceMarker.remove();
    }
    occurrenceMarkersRef.current = occurrences
      .slice(0, 200)
      .map((record) => addOccurrenceMarker(map, record));

    if (occurrences.length && !hasFitOccurrencesRef.current) {
      const bounds = new LngLatBounds(
        [selected.longitude, selected.latitude],
        [selected.longitude, selected.latitude],
      );
      for (const record of occurrences) {
        bounds.extend([record.longitude, record.latitude]);
      }
      map.fitBounds(bounds, { padding: 72, maxZoom: 11, duration: 600 });
      hasFitOccurrencesRef.current = true;
    }
  }, [occurrences, selected]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-full min-h-96 w-full"}
      aria-label="Interactive biodiversity occurrence map"
    />
  );
}
