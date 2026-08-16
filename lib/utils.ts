import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Merge Tailwind class names, resolving conflicts (later classes win) the way
 * shadcn/ui expects. Never passes secrets or user input into the class string
 * at the call sites in this project.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
