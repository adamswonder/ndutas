// Downloads rows as a CSV the owner can open in Excel or Google Sheets.
// The UTF-8 BOM makes Excel read "Ksh" and names with accents correctly.
export function downloadCsv(filename: string, rows: Record<string, string | number>[]) {
  if (rows.length === 0) return
  const headers = Object.keys(rows[0])
  const escape = (value: string | number) => {
    const text = String(value)
    return /[",\n\r]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text
  }
  const csv = [headers, ...rows.map((row) => headers.map((h) => row[h] ?? ""))]
    .map((line) => line.map(escape).join(","))
    .join("\r\n")
  const url = URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }))
  const link = document.createElement("a")
  link.href = url
  link.download = filename
  link.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
