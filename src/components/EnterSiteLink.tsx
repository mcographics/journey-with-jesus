"use client";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
export const ENTERED_SITE_KEY = "kerygma-entered-site-v1";
export function EnterSiteLink() {
  return <Link className="kerygma-enter-button" href="/company/" onClick={() => {
    try { sessionStorage.setItem(ENTERED_SITE_KEY, "yes"); } catch {}
  }}><span>Enter Site</span><ArrowRight aria-hidden="true" size={19} /></Link>;
}
