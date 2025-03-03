"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { FileIcon } from "lucide-react"
import Link from "next/link"

const mockJobs = [
  { id: "job1", timestamp: "2023-01-01T12:00:00Z", status: "completed", pipelineType: "clustering" },
  { id: "job2", timestamp: "2023-01-02T14:30:00Z", status: "running", pipelineType: "full" },
  { id: "job3", timestamp: "2023-01-03T09:15:00Z", status: "queued", pipelineType: "clustering" },
]

export default function ResultsPage() {
  const [jobs] = useState(mockJobs)

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "queued":
        return <Badge variant="outline">Queued</Badge>
      case "running":
        return <Badge variant="secondary">Running</Badge>
      case "completed":
        return <Badge variant="success">Completed</Badge>
      default:
        return <Badge variant="destructive">Failed</Badge>
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">Analysis Results</h1>

      <Card>
        <CardHeader>
          <CardTitle>Your Jobs</CardTitle>
          <CardDescription>View and manage your HMMERCTTER analysis jobs</CardDescription>
        </CardHeader>
        <CardContent>
          {jobs.length === 0 ? (
            <div className="text-center py-8">
              <FileIcon className="mx-auto h-12 w-12 text-muted-foreground" />
              <h3 className="mt-2 text-lg font-medium">No jobs found</h3>
              <p className="mt-1 text-sm text-muted-foreground">Start a new analysis to see results here</p>
              <Button className="mt-4" asChild>
                <Link href="/hmmerctter-web-app/pipeline">Start New Analysis</Link>
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Job ID</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Date</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {jobs.map((job) => (
                  <TableRow key={job.id}>
                    <TableCell className="font-medium">{job.id.substring(0, 8)}...</TableCell>
                    <TableCell>{job.pipelineType === "clustering" ? "Clustering" : "Full Pipeline"}</TableCell>
                    <TableCell>{new Date(job.timestamp).toLocaleString()}</TableCell>
                    <TableCell>{getStatusBadge(job.status)}</TableCell>
                    <TableCell className="text-right">
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/hmmerctter-web-app/results/${job.id}`}>View</Link>
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

