"use client";

import { useOptimistic, useTransition } from "react";
import { vote } from "@/app/actions/resources";

type VoteState = { mine: -1 | 0 | 1; up: number; down: number };

export default function VoteButtons({ resourceId, initial }: { resourceId: string; initial: VoteState }) {
  const [pending, startTransition] = useTransition();
  const [state, setOptimistic] = useOptimistic(initial, (s: VoteState, value: 1 | -1): VoteState => {
    const next: VoteState = { ...s, mine: s.mine === value ? 0 : value };
    if (s.mine === 1) next.up--;
    if (s.mine === -1) next.down--;
    if (next.mine === 1) next.up++;
    if (next.mine === -1) next.down++;
    return next;
  });

  const cast = (value: 1 | -1) =>
    startTransition(async () => {
      setOptimistic(value);
      await vote(resourceId, value);
    });

  const base = "btn-secondary";
  return (
    <div className="flex gap-2">
      <button onClick={() => cast(1)} disabled={pending}
        className={`${base} ${state.mine === 1 ? "border-brand-600 bg-brand-50 text-brand-700" : ""}`}>
        👍 Útil · {state.up}
      </button>
      <button onClick={() => cast(-1)} disabled={pending}
        className={`${base} ${state.mine === -1 ? "border-red-400 bg-red-50 text-red-700" : ""}`}>
        👎 No útil · {state.down}
      </button>
    </div>
  );
}
