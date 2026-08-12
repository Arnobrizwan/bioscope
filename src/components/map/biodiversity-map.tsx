"use client";

import { useEffect, useRef } from "react";
import {
  AttributionControl,
  Map,
  Marker,
  NavigationControl,
  Popup,
  type GeoJSONSource,
  type MapLayerMouseEvent,
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

const SOURCE_ID = "occurrences";
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

function occurrenceGeoJson(
  occurrences: OccurrenceRecord[],
): GeoJSON.FeatureCollection {
  return {
    type: "FeatureCollection",
    features: occurrences.slice(0, 200).map((record) => ({
      type: "Feature",
      geometry: {
        type: "Point",
        coordinates: [record.longitude, record.latitude],
      },
      properties: {
        id: record.id,
        name: record.scientificName,
        commonName: record.commonName ?? "",
        group: record.taxonomicGroup,
      },
    })),
  };
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
  const onSelectRef = useRef(onSelect);
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
      zoom: 7,
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
    map.on("load", () => {
      map.addSource(SOURCE_ID, {
        type: "geojson",
        data: occurrenceGeoJson([]),
        cluster: true,
        clusterMaxZoom: 12,
        clusterRadius: 45,
      });
      map.addLayer({
        id: "clusters",
        type: "circle",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        paint: {
          "circle-color": [
            "step",
            ["get", "point_count"],
            "#047857",
            50,
            "#065f46",
            150,
            "#064e3b",
          ],
          "circle-radius": [
            "step",
            ["get", "point_count"],
            18,
            50,
            23,
            150,
            28,
          ],
          "circle-stroke-color": "#ffffff",
          "circle-stroke-width": 2,
        },
      });
      map.addLayer({
        id: "cluster-count",
        type: "symbol",
        source: SOURCE_ID,
        filter: ["has", "point_count"],
        layout: {
          "text-field": ["get", "point_count_abbreviated"],
          "text-size": 11,
        },
        paint: { "text-color": "#ffffff" },
      });
      map.addLayer({
        id: "unclustered",
        type: "circle",
        source: SOURCE_ID,
        filter: ["!", ["has", "point_count"]],
        paint: {
          "circle-color": "#d97706",
          "circle-radius": 7,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#ffffff",
        },
      });
      map.on("click", "clusters", async (event: MapLayerMouseEvent) => {
        const feature = map.queryRenderedFeatures(event.point, {
          layers: ["clusters"],
        })[0];
        const clusterId = feature?.properties?.cluster_id as number | undefined;
        if (clusterId === undefined) return;
        const zoom = await (
          map.getSource(SOURCE_ID) as GeoJSONSource
        ).getClusterExpansionZoom(clusterId);
        const coordinates = (feature.geometry as GeoJSON.Point).coordinates as [
          number,
          number,
        ];
        map.easeTo({ center: coordinates, zoom });
      });
      map.on("click", "unclustered", (event: MapLayerMouseEvent) => {
        const feature = event.features?.[0];
        if (!feature || feature.geometry.type !== "Point") return;
        const coordinates = feature.geometry.coordinates as [number, number];
        const content = document.createElement("div");
        const name = document.createElement("strong");
        const detail = document.createElement("span");
        name.textContent = String(feature.properties?.name ?? "Occurrence");
        name.style.fontStyle = "italic";
        detail.textContent = String(
          feature.properties?.commonName || feature.properties?.group || "",
        );
        content.append(name, document.createElement("br"), detail);
        new Popup().setLngLat(coordinates).setDOMContent(content).addTo(map);
      });
    });
    mapRef.current = map;
    markerRef.current = marker;
    return () => {
      marker.remove();
      map.remove();
      mapRef.current = null;
    };
  }, []);

  useEffect(() => {
    markerRef.current?.setLngLat([selected.longitude, selected.latitude]);
  }, [selected]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const update = () =>
      (map.getSource(SOURCE_ID) as GeoJSONSource | undefined)?.setData(
        occurrenceGeoJson(occurrences),
      );
    if (map.isStyleLoaded()) update();
    else map.once("load", update);
  }, [occurrences]);

  return (
    <div
      ref={containerRef}
      className={className ?? "h-full min-h-96 w-full"}
      aria-label="Interactive biodiversity occurrence map"
    />
  );
}
