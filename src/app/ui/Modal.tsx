"use client";

import { Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import api from "@/app/services/api";
import { TransactionType } from "../enums/transactionType";
import { useTranslation } from "react-i18next";
import { XMarkIcon } from "@heroicons/react/24/outline";

function maskCurrency(value: string) {
  const numericValue = value.replace(/\D/g, "");
  const number = parseFloat(numericValue) / 100;
  if (isNaN(number)) return "";
  return number.toLocaleString("pt", { style: "currency", currency: "BRL" });
}

function parseCurrency(value: string) {
  const numericValue = value.replace(/\D/g, "");
  return parseFloat(numericValue) / 100;
}

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function TransactionModal({
  isOpen,
  onClose,
  onSuccess,
}: TransactionModalProps) {
  const { t } = useTranslation("common");

  const transactionSchema = z.object({
    amount: z.string().min(1, t("amount_required")),
    description: z.string().optional(),
    type: z.nativeEnum(TransactionType, {
      errorMap: () => ({ message: t("type_required") }),
    }),
  });

  type TransactionFormData = z.infer<typeof transactionSchema>;

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      amount: "",
      description: "",
      type: undefined,
    },
  });

  const amountWatch = watch("amount");

  useEffect(() => {
    if (amountWatch) {
      setValue("amount", maskCurrency(amountWatch));
    }
  }, [amountWatch, setValue]);

  async function onSubmit(data: TransactionFormData) {
    try {
      await api.post("/transactions", {
        amount: parseCurrency(data.amount),
        description: data.description,
        type: data.type,
      });
      reset();
      onSuccess();
      onClose();
    } catch (error) {
      console.error("Erro ao criar transação", error);
    }
  }

  return (
    <Dialog open={isOpen} onClose={onClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel className="bg-white p-6 rounded max-w-sm w-full space-y-4 relative">
          <button
            onClick={onClose}
            className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
            aria-label="Fechar"
          >
            <XMarkIcon className="w-5 h-5" />
          </button>

          <DialogTitle className="text-xl font-bold mb-2">
            {t("new_transaction")}
          </DialogTitle>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="flex flex-col gap-3"
          >
            <input
              type="text"
              placeholder={t("amount")}
              {...register("amount")}
              className="border rounded p-2"
            />
            {errors.amount && (
              <span className="text-red-500 text-sm">
                {errors.amount.message}
              </span>
            )}

            <input
              type="text"
              placeholder={t("description")}
              {...register("description")}
              className="border rounded p-2"
            />

            <select {...register("type")} className="border rounded p-2">
              <option value="">{t("modal_type_select")}</option>
              <option value={TransactionType.INCOME}>{t("income")}</option>
              <option value={TransactionType.EXPENSE}>{t("expense")}</option>
            </select>
            {errors.type && (
              <span className="text-red-500 text-sm">
                {errors.type.message}
              </span>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-70"
            >
              {isSubmitting ? t("loading") : t("add")}
            </button>
          </form>
        </DialogPanel>
      </div>
    </Dialog>
  );
}
