import { type NextRequest, NextResponse } from "next/server"
import path from "path"
import fs from "fs"
import archiver from "archiver"

export async function GET(request: NextRequest, { params }: { params: { jobId: string } }) {
  const jobId = params.jobId

  try {
    const jobDir = path.join(process.cwd(), "jobs", jobId)

    // Check if job exists and is completed
    const configPath = path.join(jobDir, "config.json")
    if (!fs.existsSync(configPath)) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 })
    }

    const configData = fs.readFileSync(configPath, "utf-8")
    const config = JSON.parse(configData)

    if (config.status !== "completed") {
      return NextResponse.json({ error: "Job is not completed yet" }, { status: 400 })
    }

    // Create a zip file stream
    const archive = archiver("zip", {
      zlib: { level: 9 }, // Maximum compression
    })

    // Pipe the archive to a buffer
    const chunks: Buffer[] = []
    archive.on("data", (chunk) => chunks.push(Buffer.from(chunk)))

    // Add files to the archive
    archive.directory(path.join(jobDir, "All_Results"), "All_Results")

    // Add log files
    if (fs.existsSync(path.join(jobDir, "Module_2.log"))) {
      archive.file(path.join(jobDir, "Module_2.log"), { name: "Module_2.log" })
    }
    if (fs.existsSync(path.join(jobDir, "HMMERCTTER_Auto_ALL.log"))) {
      archive.file(path.join(jobDir, "HMMERCTTER_Auto_ALL.log"), { name: "HMMERCTTER_Auto_ALL.log" })
    }

    // Add classification results for full pipeline
    if (config.pipelineType === "full" && fs.existsSync(path.join(jobDir, "final_classification.csv"))) {
      archive.file(path.join(jobDir, "final_classification.csv"), { name: "final_classification.csv" })
    }

    // Finalize the archive
    await archive.finalize()

    // Create a buffer from the chunks
    const buffer = Buffer.concat(chunks)

    // Return the zip file
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="hmmerctter-results-${jobId}.zip"`,
      },
    })
  } catch (error) {
    console.error(`Error downloading job ${jobId}:`, error)
    return NextResponse.json({ error: "Failed to download job results" }, { status: 500 })
  }
}

