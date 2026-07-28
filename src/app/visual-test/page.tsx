import Link from "next/link";
import { TablePlatform } from "@/components/background/table-platform";
import { CUP_HEIGHT, ROW_WIDTH } from "@/lib/game-constants";
import { FountainPreview } from "./fountain-preview";
import { CupsOnTablePreview } from "./cups-on-table-preview";

// Gap between the table and the fountain — deliberately generous so neither
// visual reads as part of the other's composition.
const MODEL_GAP_PX = 96;

// Temporary dev-only page for eyeballing standalone visual pieces (table,
// legs, fountain, ...) without running the full game or its piazza backdrop.
// Not linked from anywhere except the temporary button in game-board.tsx —
// delete both once the visuals are settled.
export default function VisualTestPage() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 bg-white p-8 text-zinc-900">
      <div className="flex w-full max-w-2xl items-center justify-between">
        <h1 className="text-xl font-semibold">Visual test page</h1>
        <Link href="/" className="text-sm text-zinc-500 underline underline-offset-4">
          Back to game
        </Link>
      </div>

      <section className="flex items-end" style={{ gap: MODEL_GAP_PX }}>
        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-500">TablePlatform</p>
          <div className="relative" style={{ width: ROW_WIDTH, height: CUP_HEIGHT }}>
            <TablePlatform />
          </div>
        </div>

        <div className="flex flex-col items-center gap-3">
          <p className="text-sm text-zinc-500">Fountain (click below to simulate a round start)</p>
          <FountainPreview />
        </div>
      </section>

      <CupsOnTablePreview />
    </main>
  );
}
