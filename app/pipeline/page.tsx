"use client"

import type React from "react"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Slider } from "@/components/ui/slider"
import { Switch } from "@/components/ui/switch"
import { useToast } from "@/components/ui/use-toast"
import { FileUploader } from "@/components/file-uploader"
import { Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PipelinePage() {
  const { toast } = useToast()
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("clustering")
  const [files, setFiles] = useState<{
    trainingFasta: File | null
    targetFasta: File | null
    phylogeneticTree: File | null
  }>({
    trainingFasta: null,
    targetFasta: null,
    phylogeneticTree: null,
  })

  const [config, setConfig] = useState({
    mode: "standard", // standard, or, ior, or+ior
    cores: 4,
    minGroupSize: 4,
    threshold: 3,
    aligner: "mafft-ginsi", // mafft-ginsi, mafft-global, mafft-auto, famsa
    step3: true,
    sorting: "low-to-high", // low-to-high, high-to-low
  })

  const handleFileChange = (type: keyof typeof files, file: File | null) => {
    setFiles((prev) => ({ ...prev, [type]: file }))
  }

  const handleConfigChange = (key: keyof typeof config, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }))
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate required files
    if (!files.trainingFasta || !files.phylogeneticTree) {
      toast({
        title: "Missing files",
        description: "Please upload the required training FASTA and phylogenetic tree files.",
        variant: "destructive",
      })
      return
    }

    if (activeTab === "classification" && !files.targetFasta) {
      toast({
        title: "Missing target file",
        description: "Please upload the target FASTA file for classification.",
        variant: "destructive",
      })
      return
    }

    setIsLoading(true)

    // Create FormData to send files and configuration
    const formData = new FormData()
    if (files.trainingFasta) formData.append("trainingFasta", files.trainingFasta)
    if (files.targetFasta) formData.append("targetFasta", files.targetFasta)
    if (files.phylogeneticTree) formData.append("phylogeneticTree", files.phylogeneticTree)

    // Add configuration parameters
    Object.entries(config).forEach(([key, value]) => {
      formData.append(key, value.toString())
    })

    // Add pipeline type (clustering or full)
    formData.append("pipelineType", activeTab === "clustering" ? "clustering" : "full")

    try {
      // Submit the form data to the API
      const response = await fetch("/api/pipeline", {
        method: "POST",
        body: formData,
      })

      if (!response.ok) {
        throw new Error("Failed to start pipeline")
      }

      const data = await response.json()

      toast({
        title: "Pipeline started",
        description: "Your analysis has been submitted successfully.",
      })

      // Redirect to the results page with the job ID
      router.push(`/results/${data.jobId}`)
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start the pipeline. Please try again.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl font-bold mb-6">HMMERCTTER Pipeline</h1>

      <Tabs defaultValue="clustering" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 mb-8">
          <TabsTrigger value="clustering">Clustering Only</TabsTrigger>
          <TabsTrigger value="full">Full Pipeline (Clustering + Classification)</TabsTrigger>
        </TabsList>

        <form onSubmit={handleSubmit}>
          <TabsContent value="clustering">
            <Card>
              <CardHeader>
                <CardTitle>Clustering Configuration</CardTitle>
                <CardDescription>
                  Configure the clustering module to group sequences with 100% precision and recall.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Input Files</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="trainingFasta">Training FASTA File</Label>
                      <FileUploader
                        id="trainingFasta"
                        accept=".fsa,.fasta"
                        onChange={(file) => handleFileChange("trainingFasta", file)}
                        value={files.trainingFasta}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phylogeneticTree">Phylogenetic Tree File</Label>
                      <FileUploader
                        id="phylogeneticTree"
                        accept=".tree,.newick"
                        onChange={(file) => handleFileChange("phylogeneticTree", file)}
                        value={files.phylogeneticTree}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Parameters</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="mode">HMMERCTTER Mode</Label>
                      <RadioGroup
                        id="mode"
                        value={config.mode}
                        onValueChange={(value) => handleConfigChange("mode", value)}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard">Standard</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="or" id="or" />
                          <Label htmlFor="or">OR</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ior" id="ior" />
                          <Label htmlFor="ior">IOR</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="or+ior" id="or+ior" />
                          <Label htmlFor="or+ior">OR+IOR</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="aligner">Aligner</Label>
                      <RadioGroup
                        id="aligner"
                        value={config.aligner}
                        onValueChange={(value) => handleConfigChange("aligner", value)}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mafft-ginsi" id="mafft-ginsi" />
                          <Label htmlFor="mafft-ginsi">MAFFT G-INS-i</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mafft-global" id="mafft-global" />
                          <Label htmlFor="mafft-global">MAFFT Global</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mafft-auto" id="mafft-auto" />
                          <Label htmlFor="mafft-auto">MAFFT Auto</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="famsa" id="famsa" />
                          <Label htmlFor="famsa">FAMSA (for large families)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="sorting">Sorting</Label>
                      <RadioGroup
                        id="sorting"
                        value={config.sorting}
                        onValueChange={(value) => handleConfigChange("sorting", value)}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low-to-high" id="low-to-high" />
                          <Label htmlFor="low-to-high">Low to High</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high-to-low" id="high-to-low" />
                          <Label htmlFor="high-to-low">High to Low</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="minGroupSize">Minimum Group Size</Label>
                      <div className="flex items-center gap-4 pt-2">
                        <Slider
                          id="minGroupSize"
                          min={2}
                          max={10}
                          step={1}
                          value={[config.minGroupSize]}
                          onValueChange={(value) => handleConfigChange("minGroupSize", value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{config.minGroupSize}</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="threshold">Threshold (Alpha)</Label>
                      <div className="flex items-center gap-4 pt-2">
                        <Slider
                          id="threshold"
                          min={1}
                          max={5}
                          step={0.5}
                          value={[config.threshold]}
                          onValueChange={(value) => handleConfigChange("threshold", value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{config.threshold}</span>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cores">Number of CPU Cores</Label>
                      <div className="flex items-center gap-4 pt-2">
                        <Slider
                          id="cores"
                          min={1}
                          max={16}
                          step={1}
                          value={[config.cores]}
                          onValueChange={(value) => handleConfigChange("cores", value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{config.cores}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="ml-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Start Clustering"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="full">
            <Card>
              <CardHeader>
                <CardTitle>Full Pipeline Configuration</CardTitle>
                <CardDescription>
                  Configure both clustering and classification modules for complete analysis.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Input Files</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="trainingFasta">Training FASTA File</Label>
                      <FileUploader
                        id="trainingFasta"
                        accept=".fsa,.fasta"
                        onChange={(file) => handleFileChange("trainingFasta", file)}
                        value={files.trainingFasta}
                      />
                    </div>
                    <div>
                      <Label htmlFor="targetFasta">Target FASTA File</Label>
                      <FileUploader
                        id="targetFasta"
                        accept=".fsa,.fasta"
                        onChange={(file) => handleFileChange("targetFasta", file)}
                        value={files.targetFasta}
                      />
                    </div>
                    <div>
                      <Label htmlFor="phylogeneticTree">Phylogenetic Tree File</Label>
                      <FileUploader
                        id="phylogeneticTree"
                        accept=".tree,.newick"
                        onChange={(file) => handleFileChange("phylogeneticTree", file)}
                        value={files.phylogeneticTree}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Clustering Parameters</h3>
                  <div className="grid gap-4">
                    <div>
                      <Label htmlFor="mode">HMMERCTTER Mode</Label>
                      <RadioGroup
                        id="mode"
                        value={config.mode}
                        onValueChange={(value) => handleConfigChange("mode", value)}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="standard" id="standard" />
                          <Label htmlFor="standard">Standard</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="or" id="or" />
                          <Label htmlFor="or">OR</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="ior" id="ior" />
                          <Label htmlFor="ior">IOR</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="or+ior" id="or+ior" />
                          <Label htmlFor="or+ior">OR+IOR</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div>
                      <Label htmlFor="aligner">Aligner</Label>
                      <RadioGroup
                        id="aligner"
                        value={config.aligner}
                        onValueChange={(value) => handleConfigChange("aligner", value)}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mafft-ginsi" id="mafft-ginsi" />
                          <Label htmlFor="mafft-ginsi">MAFFT G-INS-i</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mafft-global" id="mafft-global" />
                          <Label htmlFor="mafft-global">MAFFT Global</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="mafft-auto" id="mafft-auto" />
                          <Label htmlFor="mafft-auto">MAFFT Auto</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="famsa" id="famsa" />
                          <Label htmlFor="famsa">FAMSA (for large families)</Label>
                        </div>
                      </RadioGroup>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minGroupSize">Minimum Group Size</Label>
                        <div className="flex items-center gap-4 pt-2">
                          <Slider
                            id="minGroupSize"
                            min={2}
                            max={10}
                            step={1}
                            value={[config.minGroupSize]}
                            onValueChange={(value) => handleConfigChange("minGroupSize", value[0])}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{config.minGroupSize}</span>
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="threshold">Threshold (Alpha)</Label>
                        <div className="flex items-center gap-4 pt-2">
                          <Slider
                            id="threshold"
                            min={1}
                            max={5}
                            step={0.5}
                            value={[config.threshold]}
                            onValueChange={(value) => handleConfigChange("threshold", value[0])}
                            className="flex-1"
                          />
                          <span className="w-12 text-center">{config.threshold}</span>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="sorting">Sorting</Label>
                      <RadioGroup
                        id="sorting"
                        value={config.sorting}
                        onValueChange={(value) => handleConfigChange("sorting", value)}
                        className="grid grid-cols-2 gap-4 pt-2"
                      >
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="low-to-high" id="low-to-high" />
                          <Label htmlFor="low-to-high">Low to High</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <RadioGroupItem value="high-to-low" id="high-to-low" />
                          <Label htmlFor="high-to-low">High to Low</Label>
                        </div>
                      </RadioGroup>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-medium">Classification Parameters</h3>
                  <div className="grid gap-4">
                    <div className="flex items-center space-x-2">
                      <Switch
                        id="step3"
                        checked={config.step3}
                        onCheckedChange={(checked) => handleConfigChange("step3", checked)}
                      />
                      <Label htmlFor="step3">Enable Step 3 Classification</Label>
                    </div>

                    <div>
                      <Label htmlFor="cores">Number of CPU Cores</Label>
                      <div className="flex items-center gap-4 pt-2">
                        <Slider
                          id="cores"
                          min={1}
                          max={16}
                          step={1}
                          value={[config.cores]}
                          onValueChange={(value) => handleConfigChange("cores", value[0])}
                          className="flex-1"
                        />
                        <span className="w-12 text-center">{config.cores}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" disabled={isLoading} className="ml-auto">
                  {isLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Processing...
                    </>
                  ) : (
                    "Start Full Pipeline"
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>
        </form>
      </Tabs>
    </div>
  )
}

