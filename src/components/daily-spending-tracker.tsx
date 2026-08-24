import { useEffect, useRef, useState, type FormEvent } from "react";

type Expense = {
  id: string;
  name: string;
  amount: number;
  createdAt: number;
};

const STORAGE_KEY = "daily-spending-tracker.v1";

const currency = new Intl.NumberFormat("en-IN", {
  style: "currency",
  currency: "INR",
  maximumFractionDigits: 2,
});

function todayKey() {
  const d = new Date();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${m}-${day}`;
}

function loadExpenses(): Expense[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const data = JSON.parse(raw);
    if (data.date !== todayKey() || !Array.isArray(data.items)) return [];
    return data.items.filter(
      (e: Expense) =>
        e && typeof e.name === "string" && typeof e.amount === "number"
    );
  } catch {
    return [];
  }
}

function saveExpenses(items: Expense[]) {
  try {
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ date: todayKey(), items })
    );
  } catch {
    /* storage unavailable — in-memory only */
  }
}

export function DailySpendingTracker() {
  const [items, setItems] = useState<Expense[]>(() => loadExpenses());
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const nameInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    saveExpenses(items);
  }, [items]);

  const total = items.reduce((sum, e) => sum + e.amount, 0);
  const count = items.length;

  function addExpense(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const value = parseFloat(amount);
    if (!trimmed || !Number.isFinite(value) || value <= 0) {
      if (nameInputRef.current) {
        nameInputRef.current.focus();
        nameInputRef.current.select();
      }
      return;
    }
    const next: Expense = {
      id: typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
      name: trimmed,
      amount: Math.round(value * 100) / 100,
      createdAt: Date.now(),
    };
    setItems((prev) => [next, ...prev]);
    setName("");
    setAmount("");
    nameInputRef.current?.focus();
  }

  function removeExpense(id: string) {
    setItems((prev) => prev.filter((e) => e.id !== id));
  }

  function clearAll() {
    setItems([]);
    nameInputRef.current?.focus();
  }

  return (
    <div className="mx-auto w-full max-w-xl px-4 py-10 sm:py-16">
      <header className="mb-8 text-center">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-primary">
          {new Date().toLocaleDateString("en-IN", {
            weekday: "long",
            day: "numeric",
            month: "long",
          })}
        </p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">
          Today's Spending
        </h1>
      </header>

      {/* Total summary */}
      <div className="tracker-card mb-6 flex items-center justify-between px-6 py-5">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Total spent
          </p>
          <p className="mt-0.5 text-3xl font-extrabold tabular-nums text-foreground">
            {currency.format(total)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium text-muted-foreground">Items</p>
          <p className="mt-0.5 text-2xl font-bold tabular-nums text-foreground">
            {count}
          </p>
        </div>
      </div>

      {/* Add expense form */}
      <form
        onSubmit={addExpense}
        className="tracker-card mb-6 grid grid-cols-1 gap-3 p-5 sm:grid-cols-[1fr_auto]"
      >
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Item
            </span>
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Coffee, groceries…"
              maxLength={80}
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            />
          </label>
          <label className="block">
            <span className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Amount
            </span>
            <input
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
              className="w-full rounded-xl border border-input bg-background px-4 py-3 text-base tabular-nums text-foreground outline-none transition focus:border-ring focus:ring-4 focus:ring-ring/20"
            />
          </label>
        </div>
        <div className="flex items-end">
          <button
            type="submit"
            className="h-[46px] w-full shrink-0 rounded-xl bg-primary px-6 font-semibold text-primary-foreground shadow-sm transition hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring/30 active:scale-[0.98] sm:w-auto"
          >
            Add
          </button>
        </div>
      </form>

      {/* Expense list */}
      <div className="tracker-card p-3 sm:p-4">
        {items.length === 0 ? (
          <div className="px-4 py-10 text-center">
            <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-secondary text-2xl">
              🧾
            </div>
            <p className="font-semibold text-foreground">No expenses yet</p>
            <p className="mt-1 text-sm text-muted-foreground">
              Add your first expense above and it will appear here instantly.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {items.map((expense) => (
              <li
                key={expense.id}
                className="row-in group flex items-center gap-3 rounded-xl px-2 py-3 transition-colors hover:bg-secondary/50"
              >
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-secondary text-base">
                  {expense.name.slice(0, 1).toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-foreground">
                    {expense.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(expense.createdAt).toLocaleTimeString("en-IN", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
                <span className="font-bold tabular-nums text-foreground">
                  {currency.format(expense.amount)}
                </span>
                <button
                  type="button"
                  onClick={() => removeExpense(expense.id)}
                  aria-label={`Remove ${expense.name}`}
                  className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground opacity-60 transition hover:bg-destructive/10 hover:text-destructive group-hover:opacity-100"
                >
                  <svg
                    viewBox="0 0 24 24"
                    width="18"
                    height="18"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    <path d="M18 6 6 18M6 6l12 12" />
                  </svg>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {items.length > 0 && (
        <div className="mt-4 flex justify-center">
          <button
            type="button"
            onClick={clearAll}
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition hover:text-destructive hover:underline"
          >
            Clear all expenses
          </button>
        </div>
      )}

      <footer className="mt-10 text-center text-xs text-muted-foreground">
        Expenses are saved on this device for today only.
      </footer>
    </div>
  );
}
