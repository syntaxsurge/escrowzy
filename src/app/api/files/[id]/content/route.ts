import { readFile } from 'fs/promises'
import path from 'path'

import { NextRequest, NextResponse } from 'next/server'

import { eq } from 'drizzle-orm'

import { requireAuth } from '@/lib/auth'
import { db } from '@/lib/db'
import { fileVersions, jobPostings } from '@/lib/db/schema'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await requireAuth(request)
    const fileVersionId = parseInt(params.id)

    // Get file version with job info
    const fileVersion = await db.query.fileVersions.findFirst({
      where: eq(fileVersions.id, fileVersionId),
      with: {
        job: true
      }
    })

    if (!fileVersion) {
      return NextResponse.json(
        { success: false, error: 'File not found' },
        { status: 404 }
      )
    }

    // Verify access through job
    const job = await db.query.jobPostings.findFirst({
      where: eq(jobPostings.id, fileVersion.jobId)
    })

    if (!job || (job.clientId !== user.id && job.freelancerId !== user.id)) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 }
      )
    }

    // Determine content type and whether to read file
    const isText =
      fileVersion.mimeType.startsWith('text/') ||
      fileVersion.filename.endsWith('.txt') ||
      fileVersion.filename.endsWith('.md') ||
      fileVersion.filename.endsWith('.json') ||
      fileVersion.filename.endsWith('.yaml') ||
      fileVersion.filename.endsWith('.yml')

    const isCode =
      fileVersion.filename.endsWith('.js') ||
      fileVersion.filename.endsWith('.jsx') ||
      fileVersion.filename.endsWith('.ts') ||
      fileVersion.filename.endsWith('.tsx') ||
      fileVersion.filename.endsWith('.css') ||
      fileVersion.filename.endsWith('.scss') ||
      fileVersion.filename.endsWith('.html') ||
      fileVersion.filename.endsWith('.py') ||
      fileVersion.filename.endsWith('.java') ||
      fileVersion.filename.endsWith('.cpp') ||
      fileVersion.filename.endsWith('.c') ||
      fileVersion.filename.endsWith('.go') ||
      fileVersion.filename.endsWith('.rs') ||
      fileVersion.filename.endsWith('.php') ||
      fileVersion.filename.endsWith('.sh') ||
      fileVersion.filename.endsWith('.sql')

    // For images, videos, and PDFs, return the URL
    if (
      fileVersion.mimeType.startsWith('image/') ||
      fileVersion.mimeType.startsWith('video/') ||
      fileVersion.mimeType.includes('pdf')
    ) {
      return NextResponse.json({
        success: true,
        type: 'url',
        url: fileVersion.path,
        mimeType: fileVersion.mimeType
      })
    }

    // For text and code files, read the content
    if (isText || isCode) {
      try {
        const filePath = path.join(process.cwd(), 'public', fileVersion.path)
        const content = await readFile(filePath, 'utf-8')

        // Limit content size for preview (first 50KB)
        const maxSize = 50 * 1024
        const truncated = content.length > maxSize
        const previewContent = truncated
          ? content.substring(0, maxSize)
          : content

        return NextResponse.json({
          success: true,
          type: 'text',
          content: previewContent,
          truncated,
          language: getLanguageFromFilename(fileVersion.filename),
          mimeType: fileVersion.mimeType
        })
      } catch (error) {
        console.error('Failed to read file:', error)
        return NextResponse.json(
          {
            success: false,
            error: 'File content not available'
          },
          { status: 404 }
        )
      }
    }

    // For other file types, return download URL
    return NextResponse.json({
      success: true,
      type: 'download',
      url: fileVersion.path,
      mimeType: fileVersion.mimeType
    })
  } catch (error) {
    console.error('Failed to get file content:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to get file content' },
      { status: 500 }
    )
  }
}

function getLanguageFromFilename(filename: string): string {
  const ext = filename.split('.').pop()?.toLowerCase()
  const languageMap: Record<string, string> = {
    js: 'javascript',
    jsx: 'javascript',
    ts: 'typescript',
    tsx: 'typescript',
    py: 'python',
    rb: 'ruby',
    go: 'go',
    rs: 'rust',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    cs: 'csharp',
    php: 'php',
    html: 'html',
    css: 'css',
    scss: 'scss',
    sass: 'sass',
    less: 'less',
    json: 'json',
    xml: 'xml',
    yaml: 'yaml',
    yml: 'yaml',
    md: 'markdown',
    sql: 'sql',
    sh: 'bash',
    bash: 'bash',
    zsh: 'bash',
    fish: 'bash',
    ps1: 'powershell',
    dockerfile: 'dockerfile',
    makefile: 'makefile',
    cmake: 'cmake',
    vue: 'vue',
    svelte: 'svelte',
    swift: 'swift',
    kt: 'kotlin',
    r: 'r',
    lua: 'lua',
    pl: 'perl',
    dart: 'dart',
    scala: 'scala',
    clj: 'clojure',
    ex: 'elixir',
    exs: 'elixir',
    erl: 'erlang',
    hrl: 'erlang',
    fs: 'fsharp',
    fsx: 'fsharp',
    ml: 'ocaml',
    mli: 'ocaml',
    nim: 'nim',
    nims: 'nim',
    zig: 'zig',
    v: 'v',
    sol: 'solidity'
  }

  return languageMap[ext || ''] || 'plaintext'
}
