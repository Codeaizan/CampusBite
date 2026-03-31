"use client";

import { Download } from "lucide-react";
import { useState } from "react";

interface ExportButtonProps {
  data: any[];
  filename: string;
}

export function ExportButton({ data, filename }: ExportButtonProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    
    try {
      if (!data || data.length === 0) {
        alert("No data available to export.");
        return;
      }

      // Extract headers from the first object
      const headers = Object.keys(data[0]);

      // Convert rows to CSV format
      const csvRows = [];
      
      // Push header row
      csvRows.push(headers.join(","));

      // Push data rows
      for (const row of data) {
        const values = headers.map((header) => {
          let value = row[header];
          
          // Handle null/undefined
          if (value === null || value === undefined) {
            value = "";
          }
          // Stringify objects/arrays
          else if (typeof value === "object") {
            value = JSON.stringify(value);
          }
          // Escape quotes and wrap in quotes to handle commas in text
          else {
            value = String(value);
          }
          
          return `"${value.replace(/"/g, '""')}"`;
        });
        csvRows.push(values.join(","));
      }

      const csvString = csvRows.join("\n");
      const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
      
      // Native download approach
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute("download", `${filename}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (e) {
      console.error("Export failed", e);
      alert("Failed to export data.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      onClick={handleExport}
      disabled={isExporting}
      className="flex items-center gap-2 px-4 py-2 bg-surface-container-highest hover:bg-surface-bright text-on-surface text-sm font-bold rounded-xl transition-colors active:scale-95 disabled:opacity-50"
    >
      <Download size={16} />
      {isExporting ? "Exporting..." : "Export CSV"}
    </button>
  );
}
