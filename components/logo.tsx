interface LogoProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  showText?: boolean
}

export function Logo({ className = '', size = 'md', showText = true }: LogoProps) {
  const sizes = {
    sm: { width: 24, height: 24 },
    md: { width: 32, height: 32 },
    lg: { width: 64, height: 64 },
  }

  const { width, height } = sizes[size]

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <img
        src="/logo.png"
        alt="GLM Skills Hub"
        width={width}
        height={height}
        className="dark:invert"
      />
      {showText && (
        <span className="font-bold text-xl hidden sm:inline-block">
          GLM Skills Hub
        </span>
      )}
    </div>
  )
}
