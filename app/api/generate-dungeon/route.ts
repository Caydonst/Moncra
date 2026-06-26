// app/api/dungeon/generate/route.ts

import { NextResponse } from "next/server";
import { generateDungeonFloor } from "@/lib/shared/dungeon/mapGenerator";
import { TILE_SIZE } from "@/lib/shared/dungeon/dungeonTypes";

export async function POST(req: Request) {
    const body = await req.json();

    const numFloors = body.numFloors ?? 5;
    const width = body.width ?? 60;
    const height = body.height ?? 60;

    const floors: Record<number, ReturnType<typeof generateDungeonFloor>> = {};

    for (let i = 1; i <= numFloors; i++) {
        floors[i] = generateDungeonFloor(height, width);
    }

    return NextResponse.json({
        floors,
        worldBounds: {
            width: width * TILE_SIZE,
            height: height * TILE_SIZE,
        },
    });
}