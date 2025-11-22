import fitz 
import pytesseract 
from PIL import Image
import io 
import os 
def extract_text_from_pdf(path, ocr_if_needed=True, dpi=150):

    pages = []
    doc = fitz.open(path)
    for i in range(len(doc)):
        page = doc.load_page(i)
        txt = page.get_text("text").strip()
        if not txt and ocr_if_needed:
            pix = page.get_pixmap(dpi=dpi)
            mode = "RGB" if pix.n < 4 else "RGBA"
            img = Image.frombytes(mode, [pix.width, pix.height], pix.samples)
            ocr_text = pytesseract.image_to_string(img)
            pages.append({"page": i+1, "text": ocr_text})
        else:
            pages.append({"page": i+1, "text": txt})
    doc.close()
    return pages
def chunk_pages(pages, chunk_size=1000, overlap=200):

    chunks = []
    for p in pages:
        text = p.get("text", "") or ""
        start = 0
        length = len(text)
        if length == 0:
            chunks.append({"text": "", "meta": {"page": p["page"], "start": 0, "end": 0}})
            continue
        while start < length:
            end = min(length, start + chunk_size)
            chunk_text = text[start:end].strip()
            if chunk_text:
                meta = {"page": p["page"], "start": start, "end": end}
                chunks.append({"text": chunk_text, "meta": meta})
            start = end - overlap
            if start < 0:
                start = 0
            if end == length:
                break
    return chunks
        