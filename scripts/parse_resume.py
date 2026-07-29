#!/usr/bin/env python3
import sys
import json
import os

def extract_text_from_pdf(pdf_path):
    text = ""
    # Try PyMuPDF (fitz)
    try:
        import fitz
        doc = fitz.open(pdf_path)
        for page in doc:
            text += page.get_text()
        doc.close()
    except ImportError:
        # Fallback to pypdf if available
        try:
            from pypdf import PdfReader
            reader = PdfReader(pdf_path)
            for page in reader.pages:
                t = page.extract_text()
                if t:
                    text += t
        except Exception as e:
            text = ""
    except Exception as e:
        text = ""
    
    # If text is extremely short or empty, it might be a scanned PDF
    if len(text.strip()) < 100:
        # Attempt pytesseract OCR
        try:
            import pytesseract
            from pdf2image import convert_from_path
            # Convert PDF pages to images
            images = convert_from_path(pdf_path)
            ocr_text = ""
            for img in images:
                ocr_text += pytesseract.image_to_string(img)
            if len(ocr_text.strip()) > 50:
                text = ocr_text
        except Exception as ocr_err:
            # If OCR fails, we just keep the empty or short text
            pass

    return text

def main():
    if len(sys.argv) < 2:
        print(json.dumps({"success": False, "error": "No file path provided"}))
        sys.exit(1)
        
    file_path = sys.argv[1]
    if not os.path.exists(file_path):
        print(json.dumps({"success": False, "error": f"File does not exist: {file_path}"}))
        sys.exit(1)
        
    _, ext = os.path.splitext(file_path.lower())
    
    extracted_text = ""
    error_msg = None
    
    try:
        if ext == ".pdf":
            extracted_text = extract_text_from_pdf(file_path)
        elif ext in [".txt", ".rtf"]:
            with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
                extracted_text = f.read()
        else:
            # For DOCX or others, try docx library
            try:
                import docx
                doc = docx.Document(file_path)
                fullText = []
                for para in doc.paragraphs:
                    fullText.append(para.text)
                extracted_text = '\n'.join(fullText)
            except Exception:
                error_msg = f"Unsupported file extension: {ext} (python-docx not installed)"
    except Exception as e:
        error_msg = str(e)
        
    if error_msg:
        print(json.dumps({"success": False, "error": error_msg}))
    else:
        print(json.dumps({"success": True, "text": extracted_text}))

if __name__ == "__main__":
    main()
