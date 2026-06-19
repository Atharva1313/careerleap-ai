"use client"

import * as React from "react"

const ThemeContext = React.createContext({
  theme: "dark",
  setTheme: () => {},
})

export function ThemeProvider({
  children,
  defaultTheme = "dark",
  enableSystem = true,
  attribute = "class",
  disableTransitionOnChange = false,
}) {
  const [theme, setTheme] = React.useState(defaultTheme)

  React.useEffect(() => {
    const savedTheme = window.localStorage.getItem("theme")
    const systemPrefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches
    const initialTheme = savedTheme || (enableSystem ? (systemPrefersDark ? "dark" : "light") : defaultTheme)
    setTheme(initialTheme)
  }, [defaultTheme, enableSystem])

  React.useEffect(() => {
    const root = document.documentElement
    if (attribute === "class") {
      root.classList.remove("light", "dark")
      root.classList.add(theme)
    } else if (attribute.startsWith("data-")) {
      root.setAttribute(attribute, theme)
    } else {
      root.setAttribute(attribute, theme)
    }
    window.localStorage.setItem("theme", theme)
  }, [theme, attribute])

  const value = React.useMemo(
    () => ({ theme, setTheme }),
    [theme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  return React.useContext(ThemeContext)
}
