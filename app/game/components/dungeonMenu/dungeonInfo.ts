import TemperedDungeonImg from "../../assets/misc/dungeon_level1.png"
import RunedDungeonImg from "../../assets/misc/dungeon_level2.png"
import ExaltedDungeonImg from "../../assets/misc/dungeon_level3.png"
import AscendantDungeonImg from "../../assets/misc/dungeon_level4.png"
import MythicDungeonImg from "../../assets/misc/dungeon_level5.png"

export const colors = {
    easy: {
        hex: "#32FF7D",
        rgba: "rgba(50, 255, 156, 0.3)",
    },
    normal: {
        hex: "#FFE032",
        rgba: "rgba(255, 224, 50, 0.3)",
    },
    hard: {
        hex: "#FF6C32",
        rgba: "rgba(255, 108, 50, 0.3)",
    },
    extreme: {
        hex: "#FF3232",
        rgba: "rgba(255, 50, 50, 0.3)",
    },
    mythic: {
        hex: "#32FFFF",
        rgba: "rgba(50, 255, 255, 0.3)",
    },
    relic: {
        hex: "#FF4E32",
        rgba: "rgba(255, 78, 50, 0.3)",
    },
}

type Difficulty = keyof typeof colors;

export type Dungeon = {
    icon: typeof TemperedDungeonImg | 
        typeof TemperedDungeonImg |
        typeof ExaltedDungeonImg |
        typeof AscendantDungeonImg |
        typeof MythicDungeonImg;
    difficulty: Difficulty;
    floors: string;
}

const temperedDungeon: Dungeon = {
    icon: TemperedDungeonImg,
    difficulty: "easy",
    floors: "1-10"
}
const RunedDungeon: Dungeon = {
    icon: RunedDungeonImg,
    difficulty: "normal",
    floors: "11-20"
}
const ExaltedDungeon: Dungeon = {
    icon: ExaltedDungeonImg,
    difficulty: "hard",
    floors: "21-30"
}
const AscendantDungeon: Dungeon = {
    icon: AscendantDungeonImg,
    difficulty: "extreme",
    floors: "31-40"
}
const MythicDungeon: Dungeon = {
    icon: MythicDungeonImg,
    difficulty: "mythic",
    floors: "41-50"
}

const dungeonList = [temperedDungeon, RunedDungeon, ExaltedDungeon, AscendantDungeon, MythicDungeon]

export default dungeonList;