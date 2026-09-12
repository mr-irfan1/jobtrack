export type ResumeFileType = 'pdf' | 'doc' | 'docx' | 'other'

export interface Resume {
  id: string
  name: string
  fileName: string
  fileType: ResumeFileType
  /** File size in bytes */
  fileSize: number
  /** Base64 Data URL or blob data for in-browser viewing and downloading */
  fileData?: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export type ResumeDraft = Omit<Resume, 'id' | 'createdAt' | 'updatedAt'> & {
  id?: string
}

export type ApplicationResumeMap = Record<string, string> // applicationId -> resumeId
