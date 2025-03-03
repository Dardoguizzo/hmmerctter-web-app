"use client"

import { useEffect, useState, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Loader2, Download, ZoomIn, ZoomOut, RotateCw } from "lucide-react"

interface PhylogeneticTreeViewerProps {
  jobId: string
}

export function PhylogeneticTreeViewer({ jobId }: PhylogeneticTreeViewerProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [treeFiles, setTreeFiles] = useState<string[]>([])
  const [selectedTree, setSelectedTree] = useState<string>("")
  const [svgContent, setSvgContent] = useState<string>("")
  const [zoom, setZoom] = useState(1)
  const svgContainerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const fetchTreeFiles = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/trees`)
        if (!response.ok) {
          throw new Error("Failed to fetch tree files")
        }
        const data = await response.json()
        setTreeFiles(data.trees)

        if (data.trees.length > 0) {
          setSelectedTree(data.trees[0])
        }
      } catch (error) {
        console.error("Error fetching tree files:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTreeFiles()
  }, [jobId])

  useEffect(() => {
    const fetchTreeSvg = async () => {
      if (!selectedTree) return

      try {
        setIsLoading(true)
        const response = await fetch(`/api/jobs/${jobId}/trees/${selectedTree}`)
        if (!response.ok) {
          throw new Error("Failed to fetch tree SVG")
        }
        const data = await response.json()
        setSvgContent(data.svg)
      } catch (error) {
        console.error("Error fetching tree SVG:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchTreeSvg()
  }, [jobId, selectedTree])

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 0.2, 0.5))
  }

  const handleResetZoom = () => {
    setZoom(1)
  }

  const handleDownloadSvg = () => {
    if (!svgContent) return

    const blob = new Blob([svgContent], { type: "image/svg+xml" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${selectedTree}.svg`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="w-full sm:w-64">
          <Select value={selectedTree} onValueChange={setSelectedTree} disabled={isLoading || treeFiles.length === 0}>
            <SelectTrigger>
              <SelectValue placeholder="Select a tree" />
            </SelectTrigger>
            <SelectContent>
              {treeFiles.map((tree) => (
                <SelectItem key={tree} value={tree}>
                  {tree}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={handleZoomIn} disabled={isLoading || !svgContent}>
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleZoomOut} disabled={isLoading || !svgContent}>
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleResetZoom} disabled={isLoading || !svgContent}>
            <RotateCw className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="icon" onClick={handleDownloadSvg} disabled={isLoading || !svgContent}>
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="p-6 overflow-auto">
          {isLoading ? (
            <div className="flex justify-center items-center h-[500px]">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : treeFiles.length === 0 ? (
            <div className="flex justify-center items-center h-[500px] text-muted-foreground">
              No phylogenetic trees available
            </div>
          ) : !svgContent ? (
            <div className="flex justify-center items-center h-[500px] text-muted-foreground">
              Failed to load tree visualization
            </div>
          ) : (
            <div
              ref={svgContainerRef}
              className="overflow-auto h-[500px] flex justify-center"
              style={{ transform: `scale(${zoom})`, transformOrigin: "top center" }}
              dangerouslySetInnerHTML={{ __html: svgContent }}
            />
          )}
        </CardContent>
      </Card>
    </div>
  )
}

