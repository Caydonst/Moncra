import type {Ammunition, Item, Weapon} from "@/app/ game/items/ItemTypes";
import AUGImg from "./assets/weapons/bow/blaster4.png";
import FALImg from "./assets/weapons/bow/blaster6.png";
import AR15Img from "./assets/weapons/bow/blaster7.png";
import AugImg from "./assets/weapons/bow/blaster4.png";
import GlockImg from "./assets/weapons/bow/pistol1.png"
import DeagleImg from "./assets/weapons/bow/pistol2.png"
import handgunMagImg from "./assets/weapons/bow/handgun_mag.png"
import rifleMagImg from "./assets/weapons/bow/rifle_mag.png"
import {Chest} from "@/app/ game/chest";
import * as ex from "excalibur";
import {worldHeight, worldWidth} from "@/app/ game/map";
import {Rifle} from "@/app/ game/weapons/rifle";





const gameItems = {
    weapons: {

    },
    ammunition: {

    }
}

function getGameItems() {
    return gameItems;
}