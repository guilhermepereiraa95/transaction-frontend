'use client'

import { useTranslation } from 'next-i18next'
import { ChangeEvent } from 'react'

const LanguageSwitcher = () => {
  const { i18n } = useTranslation()

  const changeLanguage = (e: ChangeEvent<HTMLSelectElement>) => {
    i18n.changeLanguage(e.target.value)
  }

  return (
    <select
      onChange={changeLanguage}
      value={i18n.language}
      className="border border-gray-300 bg-white rounded-lg px-4 py-2 shadow-sm"
    >
      <option value="pt">PT</option>
      <option value="en">EN</option>
      <option value="es">ES</option>
    </select>
  )
}

export default LanguageSwitcher
