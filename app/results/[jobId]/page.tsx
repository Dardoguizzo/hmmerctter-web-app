"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Loader2, AlertCircle, Download, ArrowLeft, FileText, TreesIcon as Tree } from "lucide-react"
import { PhylogeneticTreeViewer } from "@/components/phylogenetic-tree-viewer"
import { ScoreDistributionChart } from "@/components/score-distribution-chart"
import { ClassificationTable } from "@/components/classification-table"
import { LogViewer } from "@/components/log-viewer"

interface JobDetails {
  id: string
  timestamp: string
  status: "queued" | "running" | "completed" | "failed"
  pipelineType: "clustering" | "full"
  config: {
    mode: string
    cores: number
    minGroupSize: number
    threshold: number
    aligner: string
    step3: boolean
    sorting: string
  }
  error?: string
  results?: {
    groups: number
    orphans: number
    outliers: number
    classifiedSequences?: number
  }
}

export default function JobResultPage() {
  const params = useParams()
  const router = useRouter()
  const jobId = params.jobId as string

  const [jobDetails, setJobDetails] = useState<JobDetails | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}`)
        if (!response.ok) {
          throw new Error("Failed to fetch job details")
        }
        const data = await response.json()
        setJobDetails(data)
      } catch (error) {
        console.error("Error fetching job details:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchJobDetails()

    // Poll for updates if job is not completed
    const interval = setInterval(() => {
      if (jobDetails?.status === "queued" || jobDetails?.status === "running") {
        fetchJobDetails()
      }
    }, 5000)

    return () => clearInterval(interval)
  }, [jobId, jobDetails?.status])

  const getStatusBadge = (status?: JobDetails["status"]) => {
    switch (status) {
      case "queued":
        return <Badge variant="outline">Queued</Badge>
      case "running":
        return <Badge variant="secondary">Running</Badge>
      case "completed":
        return <Badge variant="success">Completed</Badge>
      case "failed":
        return <Badge variant="destructive">Failed</Badge>
      default:
        return null
    }
  }

  const handleDownloadResults = async () => {
    try {
      const response = await fetch(`/api/jobs/${jobId}/download`)
      if (!response.ok) {
        throw new Error("Failed to download results")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `hmmerctter-results-${jobId}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)
    } catch (error) {
      console.error("Error downloading results:", error)
    }
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10 flex justify-center items-center min-h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!jobDetails) {
    return (
      <div className="container mx-auto py-10">
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>Failed to load job details. The job may not exist or has been deleted.</AlertDescription>
        </Alert>
        <Button className="mt-4" variant="outline" onClick={() => router.push("/results")}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Results
        </Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => router.push("/results")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Job Results</h1>
          {getStatusBadge(jobDetails.status)}
        </div>

        {jobDetails.status === "completed" && (
          <Button onClick={handleDownloadResults}>
            <Download className="mr-2 h-4 w-4" />
            Download Results
          </Button>
        )}
      </div>

      {jobDetails.status === "failed" && (
        <Alert variant="destructive" className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Job Failed</AlertTitle>
          <AlertDescription>{jobDetails.error || "An error occurred during job execution."}</AlertDescription>
        </Alert>
      )}

      {(jobDetails.status === "queued" || jobDetails.status === "running") && (
        <Alert className="mb-6">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>{jobDetails.status === "queued" ? "Job Queued" : "Job Running"}</AlertTitle>
          <AlertDescription>
            {jobDetails.status === "queued"
              ? "Your job is in the queue and will start processing soon."
              : "Your job is currently running. This page will automatically update when complete."}
          </AlertDescription>
        </Alert>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {jobDetails.status === "completed" && (
            <>
              <TabsTrigger value="trees">Phylogenetic Trees</TabsTrigger>
              <TabsTrigger value="groups">Groups</TabsTrigger>
              {jobDetails.pipelineType === "full" && <TabsTrigger value="classification">Classification</TabsTrigger>}
              <TabsTrigger value="logs">Logs</TabsTrigger>
            </>
          )}
        </TabsList>

        <TabsContent value="overview">
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Job Information</CardTitle>
                <CardDescription>Details about this analysis job</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Job ID</dt>
                    <dd className="text-sm">{jobDetails.id}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Submitted</dt>
                    <dd className="text-sm">{new Date(jobDetails.timestamp).toLocaleString()}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Pipeline Type</dt>
                    <dd className="text-sm">
                      {jobDetails.pipelineType === "clustering" ? "Clustering Only" : "Full Pipeline"}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Status</dt>
                    <dd className="text-sm">{getStatusBadge(jobDetails.status)}</dd>
                  </div>
                </dl>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Configuration</CardTitle>
                <CardDescription>Parameters used for this analysis</CardDescription>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-2 gap-4">
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">HMMERCTTER Mode</dt>
                    <dd className="text-sm capitalize">{jobDetails.config.mode}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Aligner</dt>
                    <dd className="text-sm capitalize">{jobDetails.config.aligner.replace("-", " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Min Group Size</dt>
                    <dd className="text-sm">{jobDetails.config.minGroupSize}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Threshold (Alpha)</dt>
                    <dd className="text-sm">{jobDetails.config.threshold}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">Sorting</dt>
                    <dd className="text-sm capitalize">{jobDetails.config.sorting.replace("-", " ")}</dd>
                  </div>
                  <div>
                    <dt className="text-sm font-medium text-muted-foreground">CPU Cores</dt>
                    <dd className="text-sm">{jobDetails.config.cores}</dd>
                  </div>
                  {jobDetails.pipelineType === "full" && (
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">Step 3</dt>
                      <dd className="text-sm">{jobDetails.config.step3 ? "Enabled" : "Disabled"}</dd>
                    </div>
                  )}
                </dl>
              </CardContent>
            </Card>

            {jobDetails.status === "completed" && jobDetails.results && (
              <Card className="md:col-span-2">
                <CardHeader>
                  <CardTitle>Results Summary</CardTitle>
                  <CardDescription>Overview of analysis results</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <Tree className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Groups</p>
                      <p className="text-3xl font-bold">{jobDetails.results.groups}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Sequences</p>
                      <p className="text-3xl font-bold">
                        {jobDetails.pipelineType === "full" && jobDetails.results.classifiedSequences
                          ? jobDetails.results.classifiedSequences
                          : "-"}
                      </p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Orphans</p>
                      <p className="text-3xl font-bold">{jobDetails.results.orphans}</p>
                    </div>

                    <div className="flex flex-col items-center justify-center p-4 bg-muted rounded-lg">
                      <FileText className="h-8 w-8 text-primary mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Outliers</p>
                      <p className="text-3xl font-bold">{jobDetails.results.outliers}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </TabsContent>

        {jobDetails.status === "completed" && (
          <>
            <TabsContent value="trees">
              <Card>
                <CardHeader>
                  <CardTitle>Phylogenetic Trees</CardTitle>
                  <CardDescription>
                    Interactive visualization of phylogenetic trees generated during analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PhylogeneticTreeViewer jobId={jobId} />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="groups">
              <Card>
                <CardHeader>
                  <CardTitle>Group Analysis</CardTitle>
                  <CardDescription>Details of sequence groups identified during clustering</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-2">
                    <div>
                      <h3 className="text-lg font-medium mb-4">Group Distribution</h3>
                      <ScoreDistributionChart jobId={jobId} />
                    </div>
                    <div>
                      <h3 className="text-lg font-medium mb-4">Group Details</h3>
                      <ClassificationTable jobId={jobId} type="groups" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {jobDetails.pipelineType === "full" && (
              <TabsContent value="classification">
                <Card>
                  <CardHeader>
                    <CardTitle>Classification Results</CardTitle>
                    <CardDescription>Results of sequence classification across different stages</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Tabs defaultValue="step1">
                      <TabsList className="mb-4">
                        <TabsTrigger value="step1">Step 1</TabsTrigger>
                        <TabsTrigger value="step2">Step 2</TabsTrigger>
                        {jobDetails.config.step3 && <TabsTrigger value="step3">Step 3</TabsTrigger>}
                        <TabsTrigger value="final">Final Classification</TabsTrigger>
                      </TabsList>

                      <TabsContent value="step1">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Step 1 Classification</h3>
                          <p className="text-sm text-muted-foreground">
                            Sequences classified during the first stage of the pipeline
                          </p>
                          <ClassificationTable jobId={jobId} type="step1" />
                        </div>
                      </TabsContent>

                      <TabsContent value="step2">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Step 2 Classification</h3>
                          <p className="text-sm text-muted-foreground">
                            Sequences classified during the second stage of the pipeline
                          </p>
                          <ClassificationTable jobId={jobId} type="step2" />
                        </div>
                      </TabsContent>

                      {jobDetails.config.step3 && (
                        <TabsContent value="step3">
                          <div className="space-y-4">
                            <h3 className="text-lg font-medium">Step 3 Classification</h3>
                            <p className="text-sm text-muted-foreground">
                              Sequences classified during the third stage of the pipeline
                            </p>
                            <ClassificationTable jobId={jobId} type="step3" />
                          </div>
                        </TabsContent>
                      )}

                      <TabsContent value="final">
                        <div className="space-y-4">
                          <h3 className="text-lg font-medium">Final Classification</h3>
                          <p className="text-sm text-muted-foreground">
                            Complete classification results from all stages
                          </p>
                          <ClassificationTable jobId={jobId} type="final" />
                        </div>
                      </TabsContent>
                    </Tabs>
                  </CardContent>
                </Card>
              </TabsContent>
            )}

            <TabsContent value="logs">
              <Card>
                <CardHeader>
                  <CardTitle>Execution Logs</CardTitle>
                  <CardDescription>Detailed logs from the pipeline execution</CardDescription>
                </CardHeader>
                <CardContent>
                  <LogViewer jobId={jobId} />
                </CardContent>
              </Card>
            </TabsContent>
          </>
        )}
      </Tabs>
    </div>
  )
}

