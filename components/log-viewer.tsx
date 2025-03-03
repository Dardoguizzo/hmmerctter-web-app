"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"

interface LogViewerProps {
  jobId: string
}

export function LogViewer({ jobId }: LogViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [logContent, setLogContent] = useState<string>("")

  useEffect(() => {
    const fetchLogContent = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/logs`)
        if (!response.ok) {
          throw new Error("Failed to fetch log content")
        }
        const data = await response.json()
        setLogContent(data.log)
      } catch (error) {
        console.error("Error fetching log content:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchLogContent()
  }, [jobId])

  return (
    <Card>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="flex justify-center items-center h-[400px]">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <pre className="whitespace-pre-wrap font-mono text-sm text-muted-foreground h-[400px] overflow-auto">
            {logContent}
          </pre>
        )}
      </CardContent>
    </Card>
  )
}

