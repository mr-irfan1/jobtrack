import { useCallback, useEffect, useMemo, useState } from 'react'
import type { Resume } from '../../types/resume'
import {
  addResume,
  deleteResume,
  getResumes,
  renameResume,
  setPrimaryResume,
  subscribeResumes,
} from '../../services/resumeStore'
import {
  filterResumes,
  sortResumes,
  validateResumeFile,
} from './ResumeModel'

export interface ResumesViewModel {
  resumes: Resume[]
  allResumes: Resume[]
  primaryResume: Resume | null
  totalCount: number
  searchQuery: string
  setSearchQuery: (query: string) => void
  isUploadModalOpen: boolean
  setIsUploadModalOpen: (open: boolean) => void
  uploadResume: (
    name: string,
    file: File,
    isPrimary?: boolean,
  ) => Promise<{ success: boolean; error?: string }>
  setPrimary: (id: string) => void
  rename: (id: string, newName: string) => { success: boolean; error?: string }
  removeResume: (id: string) => void
  openResume: (resume: Resume) => void
  downloadResume: (resume: Resume) => void
}

/**
 * Converts a File object to a base64 Data URL.
 */
function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result)
      } else {
        reject(new Error('Failed to encode file.'))
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsDataURL(file)
  })
}

export function useResumesViewModel(): ResumesViewModel {
  const [rawResumes, setRawResumes] = useState<Resume[]>(() => getResumes())
  const [searchQuery, setSearchQuery] = useState<string>('')
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false)

  useEffect(() => {
    const unsubscribe = subscribeResumes(() => {
      setRawResumes(getResumes())
    })
    return unsubscribe
  }, [])

  const primaryResume = useMemo(() => {
    return rawResumes.find((r) => r.isPrimary) || null
  }, [rawResumes])

  const displayedResumes = useMemo(() => {
    const filtered = filterResumes(rawResumes, searchQuery)
    return sortResumes(filtered)
  }, [rawResumes, searchQuery])

  const handleUpload = useCallback(
    async (
      name: string,
      file: File,
      isPrimary?: boolean,
    ): Promise<{ success: boolean; error?: string }> => {
      const validation = validateResumeFile(file)
      if (!validation.valid) {
        return { success: false, error: validation.error }
      }

      try {
        const fileData = await fileToDataUrl(file)
        const result = addResume({
          name: name.trim(),
          fileName: file.name,
          fileType: validation.fileType || 'pdf',
          fileSize: file.size,
          fileData,
          isPrimary: Boolean(isPrimary),
        })

        if (result.success) {
          setRawResumes(getResumes())
          setIsUploadModalOpen(false)
        }
        return result
      } catch {
        return { success: false, error: 'Could not process file. Please try again.' }
      }
    },
    [],
  )

  const handleSetPrimary = useCallback((id: string) => {
    setPrimaryResume(id)
    setRawResumes(getResumes())
  }, [])

  const handleRename = useCallback((id: string, newName: string) => {
    const result = renameResume(id, newName)
    if (result.success) {
      setRawResumes(getResumes())
    }
    return result
  }, [])

  const handleRemove = useCallback((id: string) => {
    deleteResume(id)
    setRawResumes(getResumes())
  }, [])

  const handleOpen = useCallback((resume: Resume) => {
    if (!resume.fileData) return
    const isPdfData = resume.fileData.startsWith('data:application/pdf;base64,')
    const isDocData =
      resume.fileData.startsWith('data:application/msword;base64,') ||
      resume.fileData.startsWith(
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,',
      )

    if (!isPdfData && !isDocData) {
      return
    }

    try {
      const commaIdx = resume.fileData.indexOf(',')
      if (commaIdx === -1) return
      const b64 = resume.fileData.slice(commaIdx + 1)
      const binary = atob(b64)
      const bytes = new Uint8Array(binary.length)
      for (let i = 0; i < binary.length; i++) {
        bytes[i] = binary.charCodeAt(i)
      }
      const mime = isPdfData ? 'application/pdf' : 'application/octet-stream'
      const blob = new Blob([bytes], { type: mime })
      const blobUrl = URL.createObjectURL(blob)

      window.open(blobUrl, '_blank', 'noopener,noreferrer')
      setTimeout(() => URL.revokeObjectURL(blobUrl), 60000)
    } catch {
      // Ignore conversion error gracefully
    }
  }, [])

  const handleDownload = useCallback((resume: Resume) => {
    if (!resume.fileData) return
    const isPdfData = resume.fileData.startsWith('data:application/pdf;base64,')
    const isDocData =
      resume.fileData.startsWith('data:application/msword;base64,') ||
      resume.fileData.startsWith(
        'data:application/vnd.openxmlformats-officedocument.wordprocessingml.document;base64,',
      )

    if (!isPdfData && !isDocData) {
      return
    }

    const link = document.createElement('a')
    link.href = resume.fileData
    link.download = resume.fileName.replace(/[<>:"/\\|?*]/g, '_')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }, [])

  return {
    resumes: displayedResumes,
    allResumes: rawResumes,
    primaryResume,
    totalCount: rawResumes.length,
    searchQuery,
    setSearchQuery,
    isUploadModalOpen,
    setIsUploadModalOpen,
    uploadResume: handleUpload,
    setPrimary: handleSetPrimary,
    rename: handleRename,
    removeResume: handleRemove,
    openResume: handleOpen,
    downloadResume: handleDownload,
  }
}
