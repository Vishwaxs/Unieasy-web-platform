import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function shortAddress(address: string | null): string {
  if (!address) return "Bangalore";
  // Extract locality: take the part after first comma, before city/state
  const parts = address.split(",");
  if (parts.length >= 2) {
    return parts[1].trim().replace(/\d{6}/, "").trim();
  }
  return parts[0].trim();
}
