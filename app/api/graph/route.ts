import { NextResponse } from "next/server";
import { getClubs, getUser } from "@/lib/db";
import { buildGraph } from "@/lib/graph";

export async function GET() {
  const graph = buildGraph(getUser(), getClubs());
  return NextResponse.json(graph);
}
