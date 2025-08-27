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
 * Extract detailed document structure (pages, blocks, paragraphs, words)
 */
export async function extractDocumentStructure(
  imageBuffer: Buffer,
  userId?: string
): Promise<OCRResult> {
  const startTime = Date.now();
  
  try {
    logger.info("Starting detailed document structure extraction", { userId });

    // Call Google Vision API with document text detection
    const [result] = await visionClient.documentTextDetection({
      image: {
        content: imageBuffer,
      },
    });

    if (!result.fullTextAnnotation) {
      logger.warn("No document structure detected", { userId });
      return {
        text: "",
        confidence: 0,
        pages: [],
        blocks: [],
        words: [],
        detectedLanguages: [],
      };
    }

    const fullText = result.fullTextAnnotation.text || "";
    const pages = result.fullTextAnnotation.pages || [];

    // Process pages and extract structure
    const processedPages: OCRPage[] = [];
    const allBlocks: OCRBlock[] = [];
    const allWords: OCRWord[] = [];
    let totalConfidence = 0;
    let confidenceCount = 0;

    for (const page of pages) {
      const pageData: OCRPage = {
        width: page.width || 0,
        height: page.height || 0,
        blocks: [],
      };

      for (const block of page.blocks || []) {
        const blockBbox = getBoundingBox(block.boundingBox);
        const blockText = extractTextFromBlock(block);
        const blockConfidence = block.confidence || 0;

        const blockData: OCRBlock = {
          text: blockText,
          confidence: blockConfidence,
          boundingBox: blockBbox,
          paragraphs: [],
        };

        totalConfidence += blockConfidence;
        confidenceCount++;

        for (const paragraph of block.paragraphs || []) {
          const paragraphBbox = getBoundingBox(paragraph.boundingBox);
          const paragraphText = extractTextFromParagraph(paragraph);
          const paragraphConfidence = paragraph.confidence || 0;

          const paragraphData: OCRParagraph = {
            text: paragraphText,
            confidence: paragraphConfidence,
            boundingBox: paragraphBbox,
            words: [],
          };

          for (const word of paragraph.words || []) {
            const wordBbox = getBoundingBox(word.boundingBox);
            const wordText = word.symbols?.map(s => s.text).join('') || "";
            const wordConfidence = word.confidence || 0;

            const wordData: OCRWord = {
              text: wordText,
              confidence: wordConfidence,
              boundingBox: wordBbox,
            };

            paragraphData.words.push(wordData);
            allWords.push(wordData);
          }

          blockData.paragraphs.push(paragraphData);
        }

        pageData.blocks.push(blockData);
        allBlocks.push(blockData);
      }

      processedPages.push(pageData);
    }

    const averageConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0;
    
    // Extract detected languages
    const detectedLanguages = result.textAnnotations?.[0]?.locale 
      ? [result.textAnnotations[0].locale]
      : [];

    const duration = Date.now() - startTime;
    
    logger.info("Document structure extraction completed", {
      userId,
      duration,
      textLength: fullText.length,
      confidence: averageConfidence,
      pageCount: processedPages.length,
      blockCount: allBlocks.length,
      wordCount: allWords.length,
      languages: detectedLanguages,
    });

    return {
      text: fullText,
      confidence: averageConfidence,
      pages: processedPages,
      blocks: allBlocks,
      words: allWords,
      detectedLanguages,
    };

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Document structure extraction failed", error as Error, {
      userId,
      duration,
    });
    throw new Error("Failed to extract document structure");
  }
}

/**
 * Extract text from PDF document
 */
export async function extractTextFromPDF(
  pdfBuffer: Buffer,
  userId?: string
): Promise<OCRResult> {
  // For PDFs, Google Vision API can process them directly
  return await extractTextFromImage(pdfBuffer, userId);
}

/**
 * Detect and extract tables from document images
 */
export async function extractTablesFromImage(
  imageBuffer: Buffer,
  userId?: string
): Promise<any[]> {
  const startTime = Date.now();
  
  try {
    logger.info("Starting table extraction", { userId });

    // Note: Google Vision API doesn't have built-in table detection
    // This would require additional processing or a specialized service
    // For now, we'll extract the document structure and identify table-like patterns
    
    const result = await extractDocumentStructure(imageBuffer, userId);
    
    // Simple table detection based on aligned text blocks
    const tables = detectTablesFromBlocks(result.blocks || []);
    
    const duration = Date.now() - startTime;
    logger.info("Table extraction completed", {
      userId,
      duration,
      tableCount: tables.length,
    });

    return tables;

  } catch (error) {
    const duration = Date.now() - startTime;
    logger.error("Table extraction failed", error as Error, {
      userId,
      duration,
    });
    throw new Error("Failed to extract tables from image");
  }
}

// Helper functions
function getBoundingBox(boundingBox: any): BoundingBox {
  if (!boundingBox?.vertices?.length) {
    return { x: 0, y: 0, width: 0, height: 0 };
  }

  const vertices = boundingBox.vertices;
  const xs = vertices.map((v: any) => v.x || 0);
  const ys = vertices.map((v: any) => v.y || 0);

  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);

  return {
    x: minX,
    y: minY,
    width: maxX - minX,
    height: maxY - minY,
  };
}

function extractTextFromBlock(block: any): string {
  return block.paragraphs?.map((p: any) => extractTextFromParagraph(p)).join('\n') || '';
}

function extractTextFromParagraph(paragraph: any): string {
  return paragraph.words?.map((w: any) => 
    w.symbols?.map((s: any) => s.text).join('') || ''
  ).join(' ') || '';
}

function detectTablesFromBlocks(blocks: OCRBlock[]): any[] {
  // Simple table detection algorithm
  // This is a basic implementation and could be enhanced
  
  const tables: any[] = [];
  const threshold = 10; // Pixels for alignment detection
  
  // Group blocks by similar Y coordinates (rows)
  const rows: { [key: number]: OCRBlock[] } = {};
  
  for (const block of blocks) {
    const roundedY = Math.round(block.boundingBox.y / threshold) * threshold;
    if (!rows[roundedY]) {
      rows[roundedY] = [];
    }
    rows[roundedY].push(block);
  }
  
  // Find rows with multiple aligned columns
  const tableRows = Object.entries(rows).filter(([_, rowBlocks]) => rowBlocks.length >= 2);
  
  if (tableRows.length >= 2) {
    // Simple table structure
    const tableData = tableRows.map(([y, rowBlocks]) => ({
      row: parseInt(y),
      columns: rowBlocks
        .sort((a, b) => a.boundingBox.x - b.boundingBox.x)
        .map(block => ({
          text: block.text,
          confidence: block.confidence,
          boundingBox: block.boundingBox,
        })),
    }));
    
    tables.push({
      type: 'table',
      rows: tableData.length,
      columns: Math.max(...tableData.map(row => row.columns.length)),
      data: tableData,
    });
  }
  
  return tables;
}

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