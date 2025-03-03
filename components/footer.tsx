import { Dna } from "lucide-react"
import Link from "next/link"

export default function Footer() {
  return (
    <footer className="border-t py-6 md:py-0">
      <div className="container flex flex-col items-center justify-between gap-4 md:h-16 md:flex-row">
        <div className="flex items-center gap-2">
          <Dna className="h-5 w-5" />
          <p className="text-sm text-muted-foreground">© {new Date().getFullYear()} HMMERCTTER Web App</p>
        </div>
        <div className="flex gap-4">
          <Link href="/about" className="text-sm text-muted-foreground hover:underline">
            About
          </Link>
          <Link href="/contact" className="text-sm text-muted-foreground hover:underline">
            Contact
          </Link>
          <Link
            href="https://github.com/your-repo/hmmerctter"
            className="text-sm text-muted-foreground hover:underline"
          >
            GitHub
          </Link>
        </div>
      </div>
    </footer>
  )
}

