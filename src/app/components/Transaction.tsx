"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "next-i18next";
import dayjs from "dayjs";
import { useDebounce } from "use-debounce";
import api from "../services/api";
import { TransactionModal } from "../ui/Modal";
import { TrashIcon } from "@heroicons/react/24/solid";
import { CurrencyDollarIcon } from "@heroicons/react/24/outline";
import { toast } from "react-toastify";

interface Transaction {
  id: string;
  type: "income" | "expense";
  amount: number;
  description: string;
  created_at: string;
}

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

export default function Transactions() {
  const { t } = useTranslation("common");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [textFilter, setTextFilter] = useState("");
  const [debouncedTextFilter] = useDebounce(textFilter, 400);

  const clearFilters = () => {
    setDateFilter("all");
    setTypeFilter("all");
    setTextFilter("");
  };

  useEffect(() => {
    fetchTransactions();
  }, []);

  async function fetchTransactions() {
    setLoading(true);
    try {
      const response = await api.get<Transaction[]>("/transactions");
      setTransactions(response.data);
    } catch (error) {
      toast.error(t("request_error"));
    } finally {
      setLoading(false);
    }
  }

  async function deleteTransaction(id: string) {
    try {
      await api.delete(`/transactions/${id}`);
      fetchTransactions();
      toast.success(t("request_success"));
    } catch (error) {
      toast.error(t("request_error"));
    }
  }

  const filteredTransactions = useMemo(() => {
    const now = dayjs();
    let filtered = [...transactions];

    if (dateFilter !== "all") {
      const ranges: Record<string, dayjs.Dayjs> = {
        "7days": now.subtract(7, "day"),
        "30days": now.subtract(30, "day"),
        "year": now.startOf("year"),
      };
      filtered = filtered.filter((t) =>
        dayjs(t.created_at).isAfter(ranges[dateFilter])
      );
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    if (debouncedTextFilter.trim()) {
      const search = debouncedTextFilter.toLowerCase();
      filtered = filtered.filter(
        (t) =>
          t.description.toLowerCase().includes(search) ||
          formatCurrency(t.amount).includes(search)
      );
    }

    return filtered;
  }, [transactions, dateFilter, typeFilter, debouncedTextFilter]);

  const total = useMemo(() => {
    return filteredTransactions.reduce((total, transaction) => {
      return transaction.type === "income"
        ? total + transaction.amount
        : total - transaction.amount;
    }, 0);
  }, [filteredTransactions]);

  return (
    <div className="p-8 max-w-6xl mx-auto min-h-screen bg-green-50/50 backdrop-blur-sm shadow-sm">
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-4xl font-extrabold text-gray-800">
          {t("transactions")}
        </h1>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-green-600 hover:bg-green-700 transition-all text-white font-semibold px-6 py-3 rounded-lg shadow-md"
        >
          {t("new_transaction")}
        </button>
      </div>

      <div className="flex justify-between items-center mb-6">
        <input
          type="text"
          placeholder={t("search_transaction")}
          value={textFilter}
          onChange={(e) => setTextFilter(e.target.value)}
          className="w-full md:w-1/2 bg-white border border-gray-300 rounded-lg px-4 py-2 shadow-sm"
        />

        <div
          className={`mt-10 flex items-center gap-3 p-4 rounded-lg shadow-md text-xl font-bold ${
            total >= 0
              ? "bg-green-100/70 text-green-900"
              : "bg-red-100/70 text-red-900"
          }`}
        >
          <CurrencyDollarIcon className="h-7 w-7" />
          <p>
            <span className="font-semibold">{t("total")}:</span>{" "}
            {formatCurrency(total)}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row md:space-x-6 items-start md:items-center">
        <div className="flex flex-col">
          <label className="text-sm font-semibold mb-1 text-gray-700">
            {t("filter_by_date")}
          </label>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="border border-gray-300 rounded-lg bg-white px-4 py-2 shadow-sm"
          >
            <option value="all">{t("all")}</option>
            <option value="7days">{t("last_7_days")}</option>
            <option value="30days">{t("last_30_days")}</option>
            <option value="year">{t("this_year")}</option>
          </select>
        </div>

        <div className="flex flex-col mt-4 md:mt-0">
          <label className="text-sm font-semibold mb-1 text-gray-700">
            {t("filter_by_type")}
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="border border-gray-300 rounded-lg bg-white px-4 py-2 shadow-sm"
          >
            <option value="all">{t("all")}</option>
            <option value="income">{t("income")}</option>
            <option value="expense">{t("expense")}</option>
          </select>
        </div>
      </div>

      <button
        onClick={clearFilters}
        className="text-sm text-blue-600 hover:underline cursor-pointer my-4"
      >
        {t("clear_filters")}
      </button>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-green-500"></div>
        </div>
      ) : filteredTransactions.length > 0 ? (
        <ul className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTransactions.map((transaction) => (
            <li
              key={transaction.id}
              className="relative border border-gray-200 bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-all"
            >
              <button
                onClick={() => deleteTransaction(transaction.id)}
                className="absolute top-2 right-2 text-red-500 hover:text-red-700"
                title={t("delete")}
              >
                <TrashIcon className="h-5 w-5" aria-label="Delete Transaction" />
              </button>
              <p className="text-lg font-bold text-gray-700 mb-2">
                {formatCurrency(transaction.amount)}
              </p>
              <p className="text-gray-600 mb-1">
                <span className="font-semibold">{t("description")}:</span>{" "}
                {transaction.description || "-"}
              </p>
              <p
                className={`text-sm font-medium ${
                  transaction.type === "income"
                    ? "text-green-600"
                    : "text-red-500"
                }`}
              >
                {transaction.type === "income" ? t("income") : t("expense")}
              </p>
              <p className="text-xs text-gray-400 mt-2">
                {dayjs(transaction.created_at).format("DD/MM/YYYY")}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <div className="text-center text-gray-500 text-lg mt-20">
          {t("no_transactions_found")}
        </div>
      )}

      <TransactionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={fetchTransactions}
      />
    </div>
  );
}
