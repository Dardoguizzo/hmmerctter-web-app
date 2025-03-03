"use client"

import { Button } from "@/components/ui/button"
import { ModeToggle } from "@/components/mode-toggle"
import { Dna } from "lucide-react"
import Link from "next/link"
import { usePathname } from "next/navigation"

export default function Header() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center">
        <Link href="/hmmerctter-web-app/" className="flex items-center gap-2">
          <Dna className="h-6 w-6" />
          <span className="font-bold">HMMERCTTER</span>
        </Link>
        <nav className="ml-auto flex gap-4 sm:gap-6">
          <Link href="/hmmerctter-web-app/pipeline">
            <Button variant={pathname === "/hmmerctter-web-app/pipeline" ? "default" : "ghost"}>Pipeline</Button>
          </Link>
          <Link href="/hmmerctter-web-app/results">
            <Button variant={pathname === "/hmmerctter-web-app/results" ? "default" : "ghost"}>Results</Button>
          </Link>
          <Link href="/hmmerctter-web-app/documentation">
            <Button variant={pathname === "/hmmerctter-web-app/documentation" ? "default" : "ghost"}>
              Documentation
            </Button>
          </Link>
          <ModeToggle />
        </nav>
      </div>
    </header>
  )
}

