/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { motion, AnimatePresence } from "motion/react";
import { X } from "lucide-react";

import { ReactNode } from "react";

interface MenuOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function MenuOverlay({ isOpen, onClose, title, children }: MenuOverlayProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[100]"
          />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 h-[85vh] lg:h-[70vh] lg:max-w-4xl lg:mx-auto parchment-texture z-[101] rounded-t-3xl border-t-4 border-[#c5a021] flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-[#8b7355]/30 flex justify-between items-center">
              <h2 className="text-3xl font-display text-[#2b1d0e] tracking-tight">{title}</h2>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-black/5 rounded-full transition-colors"
              >
                <X size={28} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-6 pb-32 overscroll-contain touch-pan-y">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
