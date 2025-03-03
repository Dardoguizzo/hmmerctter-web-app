"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileIcon, UploadIcon, XIcon } from "lucide-react"

interface FileUploaderProps {
  id: string
  accept?: string
  onChange: (file: File | null) => void
  value: File | null
}

export function FileUploader({ id, accept, onChange, value }: FileUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [isDragging, setIsDragging] = useState(false)

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0]
      onChange(file)
    }
  }

  const handleClick = () => {
    inputRef.current?.click()
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      onChange(file)
    }
  }

  const handleRemove = () => {
    onChange(null)
    if (inputRef.current) {
      inputRef.current.value = ""
    }
  }

  return (
    <div className="mt-1">
      <Input ref={inputRef} id={id} type="file" accept={accept} onChange={handleChange} className="hidden" />

      {!value ? (
        <div
          className={`border-2 border-dashed rounded-md p-6 text-center cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/10" : "border-muted-foreground/25 hover:border-primary/50"
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <UploadIcon className="mx-auto h-8 w-8 text-muted-foreground" />
          <p className="mt-2 text-sm text-muted-foreground">Drag and drop a file here, or click to select</p>
          {accept && (
            <p className="mt-1 text-xs text-muted-foreground">
              Accepted formats: {accept.replace(/\./g, "").replace(/,/g, ", ")}
            </p>
          )}
        </div>
      ) : (
        <div className="flex items-center justify-between p-3 border rounded-md">
          <div className="flex items-center space-x-3">
            <FileIcon className="h-5 w-5 text-primary" />
            <div className="text-sm truncate max-w-[200px]">{value.name}</div>
          </div>
          <Button variant="ghost" size="sm" onClick={handleRemove} className="h-8 w-8 p-0">
            <XIcon className="h-4 w-4" />
            <span className="sr-only">Remove file</span>
          </Button>
        </div>
      )}
    </div>
  )
}

