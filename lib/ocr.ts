/**
 * OCR utility - now using Claude's built-in vision capabilities
 * Previous Google Cloud Vision implementation moved to ocr-backup.ts
 */

export interface OCRResult {
  text: string;
  confidence: number;
  pages?: OCRPage[];
  blocks?: OCRBlock[];
  words?: OCRWord[];
  detectedLanguages?: string[];
}

export interface OCRPage {
  width: number;
  height: number;
  blocks: OCRBlock[];
}

export interface OCRBlock {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  paragraphs: OCRParagraph[];
}

export interface OCRParagraph {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
  words: OCRWord[];
}

export interface OCRWord {
  text: string;
  confidence: number;
  boundingBox: BoundingBox;
}

export interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extract text from an image file using Claude's vision capabilities
 * This is now handled directly in the analyzeDocumentWithImage function
 */
export async function extractTextFromImage(
  imageBuffer: Buffer,
  userId?: string
): Promise<OCRResult> {
  // For compatibility, we'll import and use Claude's document analysis
  const { analyzeDocumentWithImage } = await import("./claude");
  
  try {
    const result = await analyzeDocumentWithImage(imageBuffer, userId);
    
    // Convert DocumentAnalysisResult to OCRResult format
    const extractedText = [
      ...result.names.map(n => n.text),
      ...result.dates.map(d => d.text),
      ...result.places.map(p => p.text)
    ].join(' ');
    
    const avgConfidence = (
      result.names.reduce((sum, n) => sum + n.confidence, 0) +
      result.dates.reduce((sum, d) => sum + d.confidence, 0) +
      result.places.reduce((sum, p) => sum + p.confidence, 0)
    ) / (result.names.length + result.dates.length + result.places.length) || 0;
    
    return {
      text: extractedText,
      confidence: avgConfidence,
      detectedLanguages: ["en"], // Claude typically works in English
    };
  } catch (error) {
    console.error("Claude OCR extraction failed:", error);
    throw new Error("Failed to extract text from image using Claude");
  }
}

/**
 * Extract detailed document structure - now using Claude's capabilities
 * For compatibility, returns simplified structure
 */
export async function extractDocumentStructure(
  imageBuffer: Buffer,
  userId?: string
): Promise<OCRResult> {
  // Use Claude's document analysis for structure extraction
  const { analyzeDocumentWithImage } = await import("./claude");
  
  try {
    const result = await analyzeDocumentWithImage(imageBuffer, userId);
    
    // Convert DocumentAnalysisResult to OCRResult format
    const extractedText = [
      ...result.names.map(n => n.text),
      ...result.dates.map(d => d.text),
      ...result.places.map(p => p.text)
    ].join(' ');
    
    const avgConfidence = (
      result.names.reduce((sum, n) => sum + n.confidence, 0) +
      result.dates.reduce((sum, d) => sum + d.confidence, 0) +
      result.places.reduce((sum, p) => sum + p.confidence, 0)
    ) / (result.names.length + result.dates.length + result.places.length) || 0;
    
    return {
      text: extractedText,
      confidence: avgConfidence,
      pages: [], // Simplified - Claude doesn't provide page structure
      blocks: [], // Simplified - Claude doesn't provide block structure
      words: [], // Simplified - Claude doesn't provide word structure
      detectedLanguages: ["en"],
    };
  } catch (error) {
    console.error("Claude document structure extraction failed:", error);
    throw new Error("Failed to extract document structure using Claude");
  }
}

/**
 * Extract text from PDF document - using Claude
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer,
  userId?: string
): Promise<OCRResult> {
  // PDFs can be processed as images by Claude
  return await extractTextFromImage(pdfBuffer, userId);
}

/**
 * Detect and extract tables from document images - using Claude
 */
export async function extractTablesFromImage(
  imageBuffer: Buffer,
  userId?: string
): Promise<any[]> {
  try {
    console.log("Starting table extraction with Claude", { userId });

    // Claude can analyze document structure including tables
    const result = await extractDocumentStructure(imageBuffer, userId);
    
    // Simple table detection - Claude doesn't provide structured table data
    // This would need enhancement for real table extraction
    const tables: Array<Record<string, unknown>> = [];
    
    console.log("Table extraction completed", {
      userId,
      tableCount: tables.length,
    });

    return tables;

  } catch (error) {
    console.error("Table extraction failed", error);
    throw new Error("Failed to extract tables from image using Claude");
  }
}

// Helper functions for text processing (Claude-compatible)

// Export utility functions for text processing
export function cleanExtractedText(text: string): string {
  return text
    .replace(/\s+/g, ' ')  // Replace multiple spaces with single space
    .replace(/\n\s*\n/g, '\n')  // Replace multiple newlines with single newline
    .trim();
}

export function extractDatesFromText(text: string): string[] {
  const datePatterns = [
    /\b\d{1,2}\/\d{1,2}\/\d{4}\b/g,  // MM/DD/YYYY
    /\b\d{1,2}-\d{1,2}-\d{4}\b/g,    // MM-DD-YYYY
    /\b\d{4}-\d{1,2}-\d{1,2}\b/g,    // YYYY-MM-DD
    /\b\w+\s+\d{1,2},?\s+\d{4}\b/g,  // Month DD, YYYY
  ];
  
  const dates: string[] = [];
  
  for (const pattern of datePatterns) {
    const matches = text.match(pattern);
    if (matches) {
      dates.push(...matches);
    }
  }
  
  return Array.from(new Set(dates)); // Remove duplicates
}

export function extractNamesFromText(text: string): string[] {
  // Simple name extraction - this could be enhanced with NLP
  const namePattern = /\b[A-Z][a-z]+\s+[A-Z][a-z]+\b/g;
  const matches = text.match(namePattern);
  return matches ? Array.from(new Set(matches)) : [];
}