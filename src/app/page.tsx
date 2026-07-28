import { GameBoard } from "@/components/game/game-board";

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-10 p-8">
      <GameBoard />
    </main>
  );
}
