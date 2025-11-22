import os
from dotenv import load_dotenv
load_dotenv()
from celery import Celery
from database import get_conn
from pdf_parser import extract_text_from_pdf, chunk_pages
from embedding_manager import upsert_chunks, create_collection as create_chroma_collection

celery = Celery(
    'tasks', 
    broker=os.getenv('REDIS_URL', 'redis://redis:6379/0'),
    backend=os.getenv('REDIS_URL', 'redis://redis:6379/0')
)

@celery.task(bind=True)
def process_pdf_task(self, file_path, filename, user_id, collection_id):
    try:
        print(f"Processing PDF: {filename} for User {user_id}")
        
        pages = extract_text_from_pdf(file_path, ocr_if_needed=True)
        chunks = chunk_pages(pages, chunk_size=1000, overlap=200)
        
        collection_name = f"user_{user_id}__{filename}"
        create_chroma_collection(collection_name)
        upsert_chunks(collection_name, chunks)
        
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "UPDATE collections SET processing_status = 'completed' WHERE id = %s",
            (collection_id,)
        )
        conn.commit()
        conn.close()
        return {"status": "success", "collection_id": collection_id}

    except Exception as e:
        print(f"Error processing PDF: {e}")
        conn = get_conn()
        cur = conn.cursor()
        cur.execute(
            "UPDATE collections SET processing_status = 'failed' WHERE id = %s",
            (collection_id,)
        )
        conn.commit()
        conn.close()
        raise e