import { GoogleGenAI } from '@google/genai'

export const genai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY ?? '' })

export const GEMINI_MODEL = 'gemini-3.5-flash'
