import { STORAGE_KEY } from './constants.js'
import { getMockSurvey, generateMockResponses } from './mockData.js'

export function loadSurveyData() {
  if (typeof window === 'undefined' || !window.localStorage) {
    const survey = getMockSurvey()
    return { survey, responses: generateMockResponses(survey.questions, 150) }
  }
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (raw) {
      const parsed = JSON.parse(raw)
      if (parsed && parsed.survey && Array.isArray(parsed.responses)) {
        return parsed
      }
    }
  } catch {
    /* ignore */
  }
  const survey = getMockSurvey()
  const count = 100 + Math.floor(Math.random() * 101)
  const responses = generateMockResponses(survey.questions, count)
  const data = { survey, responses }
  saveSurveyData(data)
  return data
}

export function saveSurveyData(data) {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(data))
    return true
  } catch {
    return false
  }
}

export function clearSurveyData() {
  if (typeof window === 'undefined' || !window.localStorage) return false
  try {
    window.localStorage.removeItem(STORAGE_KEY)
    return true
  } catch {
    return false
  }
}

export function regenerateMockData() {
  clearSurveyData()
  return loadSurveyData()
}
