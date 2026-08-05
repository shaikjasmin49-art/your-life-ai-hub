import { createFileRoute } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { toast } from "sonner";

import { AiInsight } from "@/components/app/AiInsight";
import { GlassCard, SectionTitle } from "@/components/app/GlassCard";
import { PageHeader } from "@/components/app/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { currency, shortDate, today } from "@/lib/format";
import { useExpenseMutations, useExpenses } from "@/lib/queries";

const CATEGORIES = ["food", "transport", "study", "rent", "fun", "health", "other"];
const COLORS = ["#8b5cf6", "#3b82f6", "#06b6d4", "#a855f7", "#6366f1", "#22d3ee", "#c084fc"];

export const Route = createFileRoute("/_authenticated/expenses")({
  head: () => ({
    meta: [
      { title: "Expense Tracker — LifeOS AI" },
      {
        name: "description",
        content: "Log daily expenses, see category charts and get AI insights on your spending.",
      },
      { property: "og:title", content: "Expense Tracker — LifeOS AI" },
      { property: "og:description", content: "Daily expenses with charts and AI insights." },
    ],
  }),
  component: ExpensesPage,
});

function ExpensesPage() {
  const { data: expenses } = useExpenses();
  const { add, remove } = useExpenseMutations();
  const [note, setNote] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("food");
  const [spentOn, setSpentOn] = useState(today());

  const rows = expenses ?? [];
  const total = rows.reduce((sum, row) => sum + Number(row.amount), 0);
  const byCategory = CATEGORIES.map((item, index) => ({
    name: item,
    value: rows.filter((row) => row.category === item).reduce((sum, row) => sum + Number(row.amount), 0),
    color: COLORS[index % COLORS.length]!,
  })).filter((item) => item.value > 0);

  const context = rows
    .slice(0, 40)
    .map((row) => `${row.spent_on} · ${row.category} · $${row.amount} · ${row.note ?? ""}`)
    .join("\n");

  const handleAdd = async (event: React.FormEvent) => {
    event.preventDefault();
    const value = Number(amount);
    if (!value || value <= 0) return;
    try {
      await add.mutateAsync({ note: note.trim() || category, amount: value, category, spent_on: spentOn });
      setNote("");
      setAmount("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save the expense.");
    }
  };

  return (
    <>
      <PageHeader
        eyebrow="Expense Tracker"
        title="Where the money goes"
        description={`${currency(total)} tracked across ${rows.length} entries.`}
      />

      <div className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="Add an expense" />
            <form className="grid gap-2 sm:grid-cols-[1.4fr_0.8fr_1fr_1fr_auto]" onSubmit={handleAdd}>
              <Input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Lunch" aria-label="Note" />
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="12"
                aria-label="Amount"
              />
              <Select value={category} onValueChange={setCategory}>
                <SelectTrigger aria-label="Category">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((item) => (
                    <SelectItem key={item} value={item} className="capitalize">
                      {item}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="date" value={spentOn} onChange={(e) => setSpentOn(e.target.value)} aria-label="Date" />
              <Button type="submit" variant="hero" disabled={add.isPending} aria-label="Add expense">
                <Plus className="size-4" />
              </Button>
            </form>
          </GlassCard>

          <GlassCard>
            <SectionTitle title="Recent" />
            <ul className="divide-y divide-border">
              {rows.slice(0, 15).map((row) => (
                <li key={row.id} className="group flex items-center gap-3 py-2.5 text-sm">
                  <span className="flex-1 truncate">{row.note ?? row.category}</span>
                  <span className="text-xs uppercase tracking-wide text-muted-foreground">{row.category}</span>
                  <span className="text-xs text-muted-foreground">{shortDate(row.spent_on)}</span>
                  <span className="w-20 text-right font-medium">{currency(Number(row.amount))}</span>
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    aria-label="Delete expense"
                    className="opacity-0 group-hover:opacity-100"
                    onClick={() => remove.mutate(row.id)}
                  >
                    <Trash2 className="size-4" />
                  </Button>
                </li>
              ))}
              {rows.length === 0 ? (
                <li className="py-10 text-center text-sm text-muted-foreground">No expenses logged yet.</li>
              ) : null}
            </ul>
          </GlassCard>
        </div>

        <div className="space-y-4">
          <GlassCard>
            <SectionTitle title="By category" />
            {byCategory.length ? (
              <div className="h-56">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={byCategory} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} paddingAngle={3}>
                      {byCategory.map((item) => (
                        <Cell key={item.name} fill={item.color} stroke="transparent" />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "rgba(12,14,28,0.9)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        borderRadius: 14,
                      }}
                      formatter={(value: number) => currency(value)}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Add expenses to see the breakdown.</p>
            )}
          </GlassCard>

          <AiInsight kind="spending" title="AI spending insights" context={context} disabled={!context} />
        </div>
      </div>
    </>
  );
}
