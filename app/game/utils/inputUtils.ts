import { gameState } from "../gameState/gameState";

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

export let gameInputDisabled = false;

export function disableGameKeyboard() {
    const keyboard = gameState.engine?.input.keyboard;

    keyboard?.clear();
    keyboard?.toggleEnabled(false);

    gameInputDisabled = true;
}

export function enableGameKeyboard() {
    const keyboard = gameState.engine?.input.keyboard;

    keyboard?.clear();
    keyboard?.toggleEnabled(true);

    gameInputDisabled = false;
}