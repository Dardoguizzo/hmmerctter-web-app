import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dna, FileText, Workflow } from "lucide-react"
import Link from "next/link"

export default function Home() {
  return (
    <div className="container mx-auto py-10">
      <section className="py-12 md:py-16 lg:py-20">
        <div className="container px-4 md:px-6">
          <div className="flex flex-col items-center justify-center space-y-4 text-center">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl">
                HMMERCTTER Web Application
              </h1>
              <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                A powerful bioinformatics pipeline for sequence clustering and classification
              </p>
            </div>
            <div className="space-x-4">
              <Link href="/pipeline">
                <Button size="lg">Start Analysis</Button>
              </Link>
              <Link href="/documentation">
                <Button variant="outline" size="lg">
                  Documentation
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 md:py-16 lg:py-20 bg-muted/50">
        <div className="container px-4 md:px-6">
          <div className="grid gap-6 lg:grid-cols-3 lg:gap-12">
            <Card>
              <CardHeader>
                <Dna className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Clustering</CardTitle>
                <CardDescription>Group sequences with 100% precision and recall</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The clustering module takes FASTA files and phylogenetic trees as input, performing auto-detection of
                  sequence groups with perfect accuracy.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <Workflow className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Classification</CardTitle>
                <CardDescription>Classify target sequences using iterative refinement</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  The classification module uses the groups from clustering to classify target sequences through
                  multiple refinement stages.
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <FileText className="h-8 w-8 mb-2 text-primary" />
                <CardTitle>Visualization</CardTitle>
                <CardDescription>Interactive visualization of results</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  View phylogenetic trees, score distributions, and classification reports through an intuitive
                  interface.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  )
}

