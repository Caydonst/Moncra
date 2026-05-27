import Image from "next/image";
import styles from "./page.module.css";
import GameCanvas from "@/app/game/GameUI/GameCanvas";

export default function Home() {
  return (
    <main>
      <GameCanvas />
    </main>
  );
}
