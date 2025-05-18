'use client'
import { useTranslation } from 'react-i18next'
import Transactions from './components/Transaction'
import LanguageSwitcher from './components/LanguageSwitcher'
import "../../i18n"

export default function Home() {
  return (
    <main className="p-8">
      <LanguageSwitcher />
      <Transactions />
    </main>
  )
}


