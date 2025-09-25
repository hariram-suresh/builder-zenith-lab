import { useState } from "react";

export default function Track() {
  const [ticketId, setTicketId] = useState("");
  return (
    <main className="container py-10">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold tracking-tight">Track your ticket</h1>
        <p className="mt-2 text-muted-foreground">Enter your ticket ID to check status. This is a placeholder page and will be expanded on request.</p>
        <div className="mt-6 flex gap-2">
          <input
            className="flex-1 h-11 rounded-md border bg-background px-3"
            placeholder="e.g. CIV-ABC123-XY99"
            value={ticketId}
            onChange={(e) => setTicketId(e.target.value)}
          />
          <button className="h-11 px-4 rounded-md bg-primary text-primary-foreground">Search</button>
        </div>
        <div className="mt-8 rounded-lg border p-6">
          <p className="text-sm text-muted-foreground">Results will appear here.</p>
        </div>
      </div>
    </main>
  );
}
