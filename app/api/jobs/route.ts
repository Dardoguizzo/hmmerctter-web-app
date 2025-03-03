import { NextResponse } from "next/server"
import { readdir, readFile } from "fs/promises"
import path from "path"

export async function GET() {
  try {
    const jobsDir = path.join(process.cwd(), "jobs")

    // Get all job directories
    const jobIds = await readdir(jobsDir, { withFileTypes: true }).then((entries) =>
      entries.filter((entry) => entry.isDirectory()).map((entry) => entry.name),
    )

    // Read job configurations
    const jobs = await Promise.all(
      jobIds.map(async (jobId) => {
        try {
          const configPath = path.join(jobsDir, jobId, "config.json")
          const configData = await readFile(configPath, "utf-8")
          const config = JSON.parse(configData)

          return {
            id: config.id,
            timestamp: config.timestamp,
            status: config.status,
            pipelineType: config.pipelineType,
          }
        } catch (error) {
          console.error(`Error reading job ${jobId}:`, error)
          return null
        }
      }),
    )

    // Filter out null values and sort by timestamp (newest first)
    const validJobs = jobs
      .filter(Boolean)
      .sort((a, b) => new Date(b!.timestamp).getTime() - new Date(a!.timestamp).getTime())

    return NextResponse.json({ jobs: validJobs })
  } catch (error) {
    console.error("Error fetching jobs:", error)
    return NextResponse.json({ error: "Failed to fetch jobs" }, { status: 500 })
  }
}

