"use client"

import { useTheme } from "@/components/theme/theme-provider"
import { Toaster as Sonner, type ToasterProps } from "sonner"

function Toaster(props: ToasterProps) {
  const { theme = "system" } = useTheme()

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      richColors
      {...props}
    />
  )
}

export { Toaster }
