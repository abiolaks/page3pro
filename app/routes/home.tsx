import type { ReactElement } from "react";

export default function Home(): ReactElement {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <h1 className="text-3xl font-semibold tracking-tight">
        Talabon People Operations
      </h1>
      <p className="mt-4 text-neutral-600">
        The system of record for People and their Engagements.
      </p>
    </main>
  );
}
