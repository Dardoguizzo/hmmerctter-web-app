import { type NextRequest, NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import { mkdir } from "fs/promises"
import { exec } from "child_process"
import { promisify } from "util"
import path from "path"
import { v4 as uuidv4 } from "uuid"

const execPromise = promisify(exec)

// Rutas a los scripts de Python
const HMMERCTTER_SCRIPT_PATH = path.join(process.cwd(), "scripts", "hmmerctter", "HMMERCTTER_Auto_module_1.py")
const HC2M2_SCRIPT_PATH = path.join(process.cwd(), "scripts", "hc2m2", "HC2M2_batch.py")

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()

    // Generate a unique job ID
    const jobId = uuidv4()

    // Create job directory
    const jobDir = path.join(process.cwd(), "jobs", jobId)
    await mkdir(jobDir, { recursive: true })

    // Get files from form data
    const trainingFasta = formData.get("trainingFasta") as File
    const targetFasta = formData.get("targetFasta") as File | null
    const phylogeneticTree = formData.get("phylogeneticTree") as File

    // Get configuration parameters
    const mode = formData.get("mode") as string
    const cores = Number.parseInt(formData.get("cores") as string)
    const minGroupSize = Number.parseInt(formData.get("minGroupSize") as string)
    const threshold = Number.parseFloat(formData.get("threshold") as string)
    const aligner = formData.get("aligner") as string
    const step3 = formData.get("step3") === "true"
    const sorting = formData.get("sorting") as string
    const pipelineType = formData.get("pipelineType") as string

    // Save files to job directory
    const trainingFastaPath = path.join(jobDir, "training.fsa")
    const trainingFastaBuffer = Buffer.from(await trainingFasta.arrayBuffer())
    await writeFile(trainingFastaPath, trainingFastaBuffer)

    const phylogeneticTreePath = path.join(jobDir, "training.tree")
    const phylogeneticTreeBuffer = Buffer.from(await phylogeneticTree.arrayBuffer())
    await writeFile(phylogeneticTreePath, phylogeneticTreeBuffer)

    let targetFastaPath = ""
    if (targetFasta && pipelineType === "full") {
      targetFastaPath = path.join(jobDir, "target.fsa")
      const targetFastaBuffer = Buffer.from(await targetFasta.arrayBuffer())
      await writeFile(targetFastaPath, targetFastaBuffer)
    }

    // Save job configuration
    const jobConfig = {
      id: jobId,
      timestamp: new Date().toISOString(),
      status: "queued",
      pipelineType,
      config: {
        mode,
        cores,
        minGroupSize,
        threshold,
        aligner,
        step3,
        sorting,
      },
      files: {
        trainingFasta: trainingFastaPath,
        targetFasta: targetFastaPath,
        phylogeneticTree: phylogeneticTreePath,
      },
    }

    await writeFile(path.join(jobDir, "config.json"), JSON.stringify(jobConfig, null, 2))

    // Start the pipeline in the background
    startPipeline(jobId, jobDir, jobConfig)

    return NextResponse.json({ jobId, status: "queued" })
  } catch (error) {
    console.error("Pipeline error:", error)
    return NextResponse.json({ error: "Failed to start pipeline" }, { status: 500 })
  }
}

async function startPipeline(jobId: string, jobDir: string, config: any) {
  try {
    // Update job status
    await writeFile(path.join(jobDir, "config.json"), JSON.stringify({ ...config, status: "running" }, null, 2))

    // Map configuration to command line arguments
    const hmmerctterMode = {
      standard: 0,
      or: 1,
      ior: 2,
      "or+ior": 3,
    }[config.config.mode]

    const alignerOption = {
      "mafft-ginsi": 0,
      "mafft-global": 1,
      "mafft-auto": 2,
      famsa: 3,
    }[config.config.aligner]

    const sortingOption = config.config.sorting === "low-to-high" ? 1 : 2

    // Run clustering module using the path to the script
    const clusteringCommand = `python "${HMMERCTTER_SCRIPT_PATH}" \
      -i "${config.files.trainingFasta}" \
      -t "${config.files.phylogeneticTree}" \
      -min ${config.config.minGroupSize} \
      -s ${sortingOption} \
      -ali ${alignerOption} \
      -c ${config.config.cores} \
      -th ${config.config.threshold} \
      -hc ${hmmerctterMode}`

    console.log(`Running clustering command: ${clusteringCommand}`)
    await execPromise(clusteringCommand, { cwd: jobDir })

    // If full pipeline, run classification module using the path to the script
    if (config.pipelineType === "full") {
      const step3Option = config.config.step3 ? 1 : 0

      const classificationCommand = `python "${HC2M2_SCRIPT_PATH}" \
        -f1 "${config.files.trainingFasta}" \
        -f2 "${config.files.targetFasta}" \
        -c ${config.config.cores} \
        -s3 ${step3Option}`

      console.log(`Running classification command: ${classificationCommand}`)
      await execPromise(classificationCommand, { cwd: jobDir })
    }

    // Update job status to completed
    await writeFile(path.join(jobDir, "config.json"), JSON.stringify({ ...config, status: "completed" }, null, 2))
  } catch (error) {
    console.error(`Error in job ${jobId}:`, error)

    // Update job status to failed
    await writeFile(
      path.join(jobDir, "config.json"),
      JSON.stringify({ ...config, status: "failed", error: String(error) }, null, 2),
    )
  }
}

