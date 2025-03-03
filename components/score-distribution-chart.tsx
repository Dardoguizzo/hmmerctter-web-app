"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Loader2 } from "lucide-react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

interface ScoreDistributionChartProps {
  jobId: string
}

interface GroupData {
  group: string
  sequences: number
  orphans: number
  outliers: number
}

export function ScoreDistributionChart({ jobId }: ScoreDistributionChartProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [chartData, setChartData] = useState<GroupData[]>([])

  useEffect(() => {
    const fetchGroupData = async () => {
      try {
        const response = await fetch(`/api/jobs/${jobId}/groups`)
        if (!response.ok) {
          throw new Error("Failed to fetch group data")
        }
        const data = await response.json()
        setChartData(data.groups)
      } catch (error) {
        console.error("Error fetching group data:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchGroupData()
  }, [jobId])

  if (isLoading) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-[300px]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    )
  }

  if (chartData.length === 0) {
    return (
      <Card>
        <CardContent className="p-6 flex justify-center items-center h-[300px] text-muted-foreground">
          No group data available
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-6">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={chartData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="group" />
            <YAxis />
            <Tooltip />
            <Legend />
            <Bar dataKey="sequences" name="Sequences" fill="#3b82f6" />
            <Bar dataKey="orphans" name="Orphans" fill="#f97316" />
            <Bar dataKey="outliers" name="Outliers" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

