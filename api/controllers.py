from sqlalchemy.orm import Session
from models import File
from datetime import datetime, timedelta
import io
import zipfile
import uuid
import os
import urllib.parse

async def cleanup_expired_files(SessionLocal):
    from sqlalchemy import delete
    while True:
        try:
            db = SessionLocal()
            expiration_time = datetime.utcnow() - timedelta(hours=1)
            db.execute(
                delete(File).where(File.created_at < expiration_time)
            )
            db.commit()
        except Exception as e:
            print(f"Error during cleanup: {e}")
        finally:
            db.close()
        import asyncio
        await asyncio.sleep(300)

def save_files_to_db(files, SessionLocal):
    import asyncio
    async def _save():
        total_size = 0
        for file in files:
            content = await file.read()
            total_size += len(content)
            await file.seek(0)
        if total_size > 20 * 1024 * 1024:
            return None, "Total file size exceeds 20MB limit"
        file_id = str(uuid.uuid4())
        if len(files) > 1:
            zip_buffer = io.BytesIO()
            with zipfile.ZipFile(zip_buffer, 'w') as zip_file:
                for file in files:
                    content = await file.read()
                    zip_file.writestr(file.filename, content)
            file_content = zip_buffer.getvalue()
            filename = f"{file_id}.zip"
        else:
            file_content = await files[0].read()
            filename = files[0].filename
        db = SessionLocal()
        db_file = File(id=file_id, content=file_content, filename=filename)
        db.add(db_file)
        db.commit()
        db.close()
        return file_id, None
    return asyncio.ensure_future(_save())

def get_file_from_db(file_id, SessionLocal):
    db = SessionLocal()
    file = db.query(File).filter(File.id == file_id).first()
    db.close()
    return file

def get_content_type(filename):
    extension = os.path.splitext(filename)[1].lower()
    if extension == '.zip':
        return "application/zip"
    content_types = {
        '.pdf': 'application/pdf',
        '.txt': 'text/plain',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png'
    }
    return content_types.get(extension, "application/octet-stream")

def get_encoded_filename(filename):
    return urllib.parse.quote(filename) 