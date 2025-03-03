import { type NextRequest, NextResponse } from "next/server"
import { readFile, readdir } from "fs/promises"
import path from "path"
import fs from "fs"

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId

  try {
    const jobDir = path.join(process.cwd(), "jobs", jobId)
    const configPath = path.join(jobDir, "config.json")

    // Read job configuration
    const configData = await readFile(configPath, "utf-8")
    const config = JSON.parse(configData)

    // If job is completed, add results summary
    if (config.status === "completed") {
      // Parse results from output files
      const resultsDir = path.join(jobDir, "All_Results")

      if (fs.existsSync(resultsDir)) {
        const groupsDir = path.join(resultsDir, "Groups_100PR")
        const orphansDir = path.join(resultsDir, "Orphans")
        const outliersDir = path.join(resultsDir, "Outliers")

        // Count groups, orphans, and outliers
        const groups = fs.existsSync(groupsDir)
          ? (await readdir(groupsDir)).filter((file) => file.endsWith(".fsa")).length
          : 0

        const orphans = fs.existsSync(orphansDir) ? (await readdir(orphansDir)).length : 0

        const outliers = fs.existsSync(outliersDir) ? (await readdir(outliersDir)).length : 0

        // For full pipeline, count classified sequences
        let classifiedSequences = 0
        if (config.pipelineType === "full") {
          const finalClassificationPath = path.join(jobDir, "final_classification.csv")
          if (fs.existsSync(finalClassificationPath)) {
            const classificationData = await readFile(finalClassificationPath, "utf-8")
            const lines = classificationData.split("\n").filter(Boolean)
            classifiedSequences = lines.length
          }
        }

        config.results = {
          groups,
          orphans,
          outliers,
          ...(config.pipelineType === "full" && { classifiedSequences }),
        }
      }
    }

    return NextResponse.json(config)
  } catch (error) {
    console.error(`Error fetching job ${jobId}:`, error)
    return NextResponse.json({ error: "Failed to fetch job details" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId

  try {
    const jobDir = path.join(process.cwd(), "jobs", jobId)

    // Delete job directory recursively
    fs.rmSync(jobDir, { recursive: true, force: true })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(`Error deleting job ${jobId}:`, error)
    return NextResponse.json({ error: "Failed to delete job" }, { status: 500 })
  }
}

