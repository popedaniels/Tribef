import { useEffect, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { getApiBaseUrl } from "../../utils/api";
import styles from "./OrganiserTodos.module.scss";

interface Todo {
  id: string;
  level: "urgent" | "important" | "suggested";
  title: string;
  detail: string;
  href: string;
  action: string | null;
}

const LABEL = { urgent: "Urgent", important: "Important", suggested: "Suggested" };

/** "What needs your attention" for organisers (GET /api/fundingRequests/me/todos). */
export default function OrganiserTodos() {
  const [todos, setTodos] = useState<Todo[] | null>(null);

  useEffect(() => {
    axios
      .get(`${getApiBaseUrl()}/api/fundingRequests/me/todos`, { withCredentials: true, timeout: 8000 })
      .then((r) => setTodos(r.data?.data || []))
      .catch(() => setTodos([]));
  }, []);

  if (todos === null) return <div className="ft-skeleton" style={{ height: 96, width: "100%", marginBottom: 24 }} aria-label="Loading your to-do list" />;
  if (!todos.length) {
    return (
      <section className={`${styles.wrap} ${styles.clear}`} aria-label="Your to-do list">
        <p>
          <strong>You&apos;re all caught up.</strong> No receipts due and nothing blocking your payouts.
        </p>
      </section>
    );
  }
  return (
    <section className={styles.wrap} aria-labelledby="todo-title">
      <h2 id="todo-title">Needs your attention ({todos.length})</h2>
      <ul>
        {todos.slice(0, 6).map((t) => (
          <li key={t.id} className={styles[t.level]}>
            <span className={`ft-chip ${t.level === "urgent" ? "ft-chip--bad" : t.level === "important" ? "ft-chip--warn" : "ft-chip--neutral"}`}>{LABEL[t.level]}</span>
            <div className={styles.body}>
              <strong>{t.title}</strong>
              <span>{t.detail}</span>
            </div>
            {t.action && (
              <Link href={t.href} className="ft-btn ft-btn--secondary ft-btn--sm">
                {t.action}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
