import TemperedDungeonImg from "../../assets/misc/dungeon_level1.png"
import RunedDungeonImg from "../../assets/misc/dungeon_level2.png"
import ExaltedDungeonImg from "../../assets/misc/dungeon_level3.png"
import AscendantDungeonImg from "../../assets/misc/dungeon_level4.png"
import MythicDungeonImg from "../../assets/misc/dungeon_level5.png"

export const colors = {
    tempered: {
        hex: "#32FF9C",
        rgba: "rgba(50, 255, 156, 0.3)",
    },
    runed: {
        hex: "#FFE032",
        rgba: "rgba(255, 224, 50, 0.3)",
    },
    exalted: {
        hex: "#FF3232",
        rgba: "rgba(255, 50, 50, 0.3)",
    },
    ascendant: {
        hex: "#F132FF",
        rgba: "rgba(241, 50, 255, 0.3)",
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
    name: string;
    difficulty: Difficulty;
}

const temperedDungeon: Dungeon = {
    icon: TemperedDungeonImg,
    name: "Tempered",
    difficulty: "tempered",
}
const RunedDungeon: Dungeon = {
    icon: RunedDungeonImg,
    name: "Runed",
    difficulty: "runed",
}
const ExaltedDungeon: Dungeon = {
    icon: ExaltedDungeonImg,
    name: "Exalted",
    difficulty: "exalted",
}
const AscendantDungeon: Dungeon = {
    icon: AscendantDungeonImg,
    name: "Ascendant",
    difficulty: "ascendant",
}
const MythicDungeon: Dungeon = {
    icon: MythicDungeonImg,
    name: "Mythic",
    difficulty: "mythic",
}

const dungeonList = [temperedDungeon, RunedDungeon, ExaltedDungeon, AscendantDungeon, MythicDungeon]

export default dungeonList;