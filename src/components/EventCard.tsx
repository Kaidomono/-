/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion } from "motion/react";
import { GameEvent, GameChoice } from "../types";

export interface EventCardProps {
  event: GameEvent;
  onChoice: (choice: GameChoice) => void;
  key?: string | number;
}

export function EventCard({ event, onChoice }: EventCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.9, y: -20 }}
      className="w-full max-w-lg parchment-texture p-6 rounded-lg border-2 border-[#8b7355] relative overflow-hidden"
    >
      <div className="absolute top-0 right-0 p-2 text-[10px] opacity-20 font-mono">
        EVENT ID: {event.id}
      </div>

      <h2 className="text-2xl font-display text-[#2b1d0e] mb-4 text-center border-b border-[#8b7355]/30 pb-2">
        {event.title}
      </h2>

      <p className="text-base text-[#2b1d0e] mb-6 leading-relaxed italic font-serif">
        "{event.description}"
      </p>

      <div className="flex flex-col gap-3">
        {event.choices.map((choice, idx) => (
          <motion.button
            key={idx}
            whileHover={{ scale: 1.02, backgroundColor: "rgba(139, 115, 85, 0.2)" }}
            whileTap={{ scale: 0.98 }}
            onClick={() => onChoice(choice)}
            className="w-full p-4 border border-[#8b7355]/50 rounded text-left text-sm font-medium hover:border-[#8b7355] transition-colors bg-white/30 backdrop-blur-sm"
          >
            {choice.text}
          </motion.button>
        ))}
      </div>
    </motion.div>
  );
}
