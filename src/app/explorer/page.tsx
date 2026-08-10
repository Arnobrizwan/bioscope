import type { Metadata } from "next";
import { ExplorerClient } from "@/features/explorer/explorer-client";

export const metadata: Metadata = { title: "Explorer" };
export default function ExplorerPage() { return <ExplorerClient />; }
