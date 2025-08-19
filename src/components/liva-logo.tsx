'use client'

// Debug logs for component rendering
console.log('Rendering Liva Logo component')

export function LivaLogo() {
  return (
    <div className="relative size-16" data-name="liva">
      <img 
        src="/images/onboarding/liva-icon-01-01.png" 
        alt="Liva Logo" 
        className="h-16 w-16 object-contain"
      />
    </div>
  )
}
