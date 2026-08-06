import { gameState } from "../gameState/gameState";

export type InputMode =
    | "gameplay"
    | "inventory"
    | "dungeon-menu"
    | "typing";

let currentInputMode: InputMode = "gameplay";
let modeBeforeTyping: InputMode = "gameplay";

export function setInputMode(mode: InputMode): void {
    currentInputMode = mode;

    const keyboard = gameState.engine?.input.keyboard;

    keyboard?.clear();
    keyboard?.toggleEnabled(mode === "gameplay");
}

export function getInputMode(): InputMode {
    return currentInputMode;
}

export function beginTyping(): void {
    if (currentInputMode === "typing") return;

    modeBeforeTyping = currentInputMode;
    setInputMode("typing");
}

export function endTyping(): void {
    if (currentInputMode !== "typing") return;

    setInputMode(modeBeforeTyping);
}

export function isTypingInInput(): boolean {
    const activeElement = document.activeElement;

    return (
        activeElement instanceof HTMLInputElement ||
        activeElement instanceof HTMLTextAreaElement ||
        activeElement instanceof HTMLSelectElement ||
        (activeElement instanceof HTMLElement &&
            activeElement.isContentEditable)
    );
}