'use client'

import { useEffect, useState } from 'react'

interface VersionData {
  name: string
  version: string
  updateDate: string
  changelog: Array<{
    version: string
    date: string
    features: string[]
  }>
}

export function VersionInfo() {
  const [version, setVersion] = useState<string>('加载中...')

  useEffect(() => {
    fetch('/version.json')
      .then(res => res.json())
      .then((data: VersionData) => {
        setVersion(data.version)
      })
      .catch(() => {
        setVersion('1.1.0')
      })
  }, [])

  return (
    <span className="text-xs">
      v{version}
    </span>
  )
}
