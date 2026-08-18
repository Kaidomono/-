/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { ReactNode } from "react";

interface StatProgressBarProps {
  label: string;
  value: number;
  color: string;
  icon: ReactNode;
}

export function StatProgressBar({ label, value, color, icon }: StatProgressBarProps) {
  const safeValue = isNaN(value) ? 0 : value;
  return (
    <div className="flex flex-col gap-0.5 w-full scale-90 sm:scale-100">
      <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-[#5d4037]">
        <div className="flex items-center gap-1">
          {icon}
          <span>{label}</span>
        </div>
        <span>{Math.floor(safeValue)}%</span>
      </div>
      <div className="h-1.5 w-full bg-[#d7ccc8] rounded-full overflow-hidden border border-[#8d6e63]/20">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${safeValue}%` }}
          className={`h-full ${color}`}
        />
      </div>
    </div>
  );
}
