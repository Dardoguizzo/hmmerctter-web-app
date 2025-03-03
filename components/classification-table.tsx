"use client"

import { useEffect, useState } from "react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Loader2, Search } from "lucide-react"

interface ClassificationTableProps {
  jobId: string
  type: "groups" | "step1" | "step2" | "step3" | "final"
}

interface ClassificationEntry {
  sequence: string
  group: string | number
  stage?: string | number
}

export function ClassificationTable({ jobId, type }: ClassificationTableProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [data, setData] = useState<ClassificationEntry[]>([])
  const [filteredData, setFilteredData] = useState<ClassificationEntry[]>([])
  const [searchTerm, setSearchTerm] = useState("")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/classification?type=${type}`)
        if (!response.ok) {
          throw new Error("Failed to fetch classification data")
        }
        const responseData = await response.json()
        setData(responseData.data)
        setFilteredData(responseData.data)
      } catch (error) {
        console.error("Error fetching classification data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchData()
  }, [jobId, type])

  useEffect(() => {
    if (searchTerm.trim() === "") {
      setFilteredData(data)
    } else {
      const filtered = data.filter(
        (entry) =>
          entry.sequence.toLowerCase().includes(searchTerm.toLowerCase()) ||
          String(entry.group).toLowerCase().includes(searchTerm.toLowerCase()),
      )
      setFilteredData(filtered)
    }
  }, [searchTerm, data])

  const getGroupBadge = (group: string | number) => {
    if (group === "-" || group === "-1" || group === "-2" || group === "-3") {
      return <Badge variant="destructive">Orphan</Badge>
    }
    return <Badge variant="outline">Group {group}</Badge>
  }

  const getStageBadge = (stage: string | number | undefined) => {
    if (!stage) return null

    switch (String(stage)) {
      case "0":
        return <Badge variant="secondary">Training</Badge>
      case "1":
        return <Badge variant="default">Step 1</Badge>
      case "2":
        return <Badge variant="default">Step 2</Badge>
      case "3":
        return <Badge variant="default">Step 3</Badge>
      default:
        return <Badge variant="outline">{stage}</Badge>
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="flex justify-center items-center h-[300px] text-muted-foreground">
        No classification data available
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search sequences or groups..."
          className="pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      <div className="border rounded-md">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sequence</TableHead>
              <TableHead>Group</TableHead>
              {type === "final" && <TableHead>Stage</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredData.length === 0 ? (
              <TableRow>
                <TableCell colSpan={type === "final" ? 3 : 2} className="text-center text-muted-foreground">
                  No results found
                </TableCell>
              </TableRow>
            ) : (
              filteredData.slice(0, 100).map((entry, index) => (
                <TableRow key={index}>
                  <TableCell className="font-mono text-xs">{entry.sequence}</TableCell>
                  <TableCell>{getGroupBadge(entry.group)}</TableCell>
                  {type === "final" && <TableCell>{getStageBadge(entry.stage)}</TableCell>}
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
        {filteredData.length > 100 && (
          <div className="p-2 text-center text-sm text-muted-foreground">
            Showing 100 of {filteredData.length} results
          </div>
        )}
      </div>
    </div>
  )
}

