import { useState, useEffect, useCallback } from 'react'
import {
  loadConfigFromStorage,
  saveConfigToStorage,
  applyThemeToDocument,
  parseConfigFromJson,
  mergeConfigWithDefaults,
  triggerDownload,
  exportConfigToJson,
  isValidHexColor,
} from './themeUtils'
import { getColorsByMode, THEME_MODES, LIGHT_COLORS, DARK_COLORS } from './themeConfig'

const detectModifiedKeys = (currentColors, mode) => {
  const defaults = mode === THEME_MODES.DARK ? DARK_COLORS : LIGHT_COLORS
  const modified = new Set()
  for (const key of Object.keys(currentColors)) {
    if (currentColors[key] !== defaults[key]) {
      modified.add(key)
    }
  }
  return modified
}

export const useThemeEditor = (containerRef) => {
  const initialConfig = loadConfigFromStorage()
  const [config, setConfig] = useState(() => initialConfig)
  const [modifiedColorKeys, setModifiedColorKeys] = useState(() =>
    detectModifiedKeys(initialConfig.colors, initialConfig.mode)
  )

  useEffect(() => {
    const target = containerRef?.current || document.documentElement
    applyThemeToDocument(config, target)
    saveConfigToStorage(config)
  }, [config, containerRef])

  const setMode = useCallback((mode) => {
    setConfig((prev) => {
      if (mode === prev.mode) return prev
      const targetDefaults = getColorsByMode(mode)
      const sourceDefaults = prev.mode === THEME_MODES.DARK ? DARK_COLORS : LIGHT_COLORS

      const newColors = { ...prev.colors }
      for (const key of Object.keys(targetDefaults)) {
        if (prev.colors[key] === sourceDefaults[key] && !modifiedColorKeys.has(key)) {
          newColors[key] = targetDefaults[key]
        }
      }
      return {
        ...prev,
        mode,
        colors: newColors,
      }
    })
  }, [modifiedColorKeys])

  const toggleMode = useCallback(() => {
    setConfig((prev) => {
      const newMode = prev.mode === THEME_MODES.LIGHT ? THEME_MODES.DARK : THEME_MODES.LIGHT
      const targetDefaults = getColorsByMode(newMode)
      const sourceDefaults = prev.mode === THEME_MODES.DARK ? DARK_COLORS : LIGHT_COLORS

      const newColors = { ...prev.colors }
      for (const key of Object.keys(targetDefaults)) {
        if (prev.colors[key] === sourceDefaults[key] && !modifiedColorKeys.has(key)) {
          newColors[key] = targetDefaults[key]
        }
      }
      return {
        ...prev,
        mode: newMode,
        colors: newColors,
      }
    })
  }, [modifiedColorKeys])

  const setColor = useCallback((key, value) => {
    if (!isValidHexColor(value)) return
    setConfig((prev) => ({
      ...prev,
      colors: {
        ...prev.colors,
        [key]: value,
      },
    }))
    setModifiedColorKeys((prev) => new Set(prev).add(key))
  }, [])

  const setTypography = useCallback((key, value) => {
    setConfig((prev) => ({
      ...prev,
      typography: {
        ...prev.typography,
        [key]: value,
      },
    }))
  }, [])

  const resetToDefaults = useCallback(() => {
    setConfig(mergeConfigWithDefaults({}))
    setModifiedColorKeys(new Set())
  }, [])

  const exportConfig = useCallback(() => {
    const json = exportConfigToJson(config)
    triggerDownload(json, `theme-config-${Date.now()}.json`)
  }, [config])

  const importConfig = useCallback((file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = parseConfigFromJson(e.target.result)
        if (result.success) {
          setConfig(result.config)
          setModifiedColorKeys(new Set())
          resolve(result.config)
        } else {
          reject(new Error(result.errors.join('; ')))
        }
      }
      reader.onerror = () => reject(new Error('文件读取失败'))
      reader.readAsText(file)
    })
  }, [])

  return {
    config,
    setMode,
    toggleMode,
    setColor,
    setTypography,
    resetToDefaults,
    exportConfig,
    importConfig,
  }
}
