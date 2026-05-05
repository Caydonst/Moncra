"use client";

import { useEffect } from "react";
import { updateInventoryUI, showItemInfo } from "../inventory/updateInventoryUI";

export default function GameUI() {

    useEffect(() => {
        const closeBtn = document.getElementById("item-info-close");
        const panel = document.getElementById("item-info-panel");

        if (!closeBtn || !panel) return;

        closeBtn.onclick = () => {
            panel.classList.add("hidden");
        };
    }, []); // run once after DOM exists

    return (
        <>
            <div id="inventory-wrapper">
                <div id="inventory">
                    <h3>Inventory</h3>
                    <div className="inventory-inner">
                        <div className="gear-container">
                            <div className="weapon-slot-wrapper">
                                <div id="weapon-slot"></div>
                            </div>
                            <div id="armor-slots">
                                <div id="armor-slot-0" className="slot"></div>
                                <div id="armor-slot-1" className="slot"></div>
                                <div id="armor-slot-2" className="slot"></div>
                            </div>
                        </div>
                        <div id="misc-grid">
                            <div id="misc-slot-0" className="slot"></div>
                            <div id="misc-slot-1" className="slot"></div>
                            <div id="misc-slot-2" className="slot"></div>
                            <div id="misc-slot-3" className="slot"></div>
                            <div id="misc-slot-4" className="slot"></div>
                            <div id="misc-slot-5" className="slot"></div>
                            <div id="misc-slot-6" className="slot"></div>
                            <div id="misc-slot-7" className="slot"></div>
                            <div id="misc-slot-8" className="slot"></div>
                            <div id="misc-slot-9" className="slot"></div>
                            <div id="misc-slot-10" className="slot"></div>
                            <div id="misc-slot-11" className="slot"></div>
                        </div>
                    </div>
                </div>
            </div>
            <div id="item-info-panel" className="item-info hidden">
                <button id="item-info-close" className="close-btn">X</button>
                <div id="item-icon-wrapper">
                    <div id="item-icon-container">
                        <img id="item-info-icon"/>
                    </div>
                </div>
                <div className="item-info-text">
                    <h1 id="item-info-name"></h1>
                    <p id="item-info-type"></p>
                </div>
                <div className="item-description-container">
                    <p id="item-info-description"></p>
                    <div id="item-info-stats"></div>
                </div>
            </div>
            <button id="spawn-btn">Spawn</button>
        </>
    );
}
