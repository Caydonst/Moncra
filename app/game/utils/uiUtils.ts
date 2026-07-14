

export const colors = {
    common: {
        hex: "#ffffff",
        rgba: "#666666",
    },
    uncommon: {
        hex: "#32FF9C",
        rgba: "#14663E",
    },
    rare: {
        hex: "#32FFFF",
        rgba: "#146666",
    },
    epic: {
        hex: "#F132FF",
        rgba: "#5F1466",
    },
    legendary: {
        hex: "#FFAE00",
        rgba: "#664400",
    },
    relic: {
        hex: "#FF4E32",
        rgba: "#661F14",
    },
    exalted: {
        hex: "#FF3232",
        rgba: "#661414",
    },
}

export const specializationColors = {
    Duelist: {
        color: "#00E5FF",
        background: "#002E33"
    },
    Executioner: {
        color: "#FF0000",
        background: "#330000"
    },
    Sentinel: {
        color: "#FFBF00",
        background: "#332500"
    },
} as const;



export const upgradeNumbers = {
    "damage": 10,
    "crit": 0.5,
    "hp": 10,
    "armor": 2,
}
