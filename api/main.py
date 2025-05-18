from fastapi import FastAPI, UploadFile, HTTPException, BackgroundTasks
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import create_engine, Column, String, LargeBinary, DateTime, delete
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
from datetime import datetime, timedelta
import io
import zipfile
import uuid
import asyncio
import os

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:admin@localhost:5432/files")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

class File(Base):
    __tablename__ = "files"
    id = Column(String, primary_key=True, index=True)
    content = Column(LargeBinary)
    filename = Column(String)
    created_at = Column(DateTime, default=datetime.utcnow)

Base.metadata.create_all(bind=engine)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

async def cleanup_expired_files():
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
        await asyncio.sleep(300)

@app.on_event("startup")
async def start_cleanup_task():
    asyncio.create_task(cleanup_expired_files())

@app.post("/upload")
async def upload_files(files: list[UploadFile]):
    if not files:
        raise HTTPException(status_code=400, detail="No files provided")
    
    total_size = 0
    for file in files:
        content = await file.read()
        total_size += len(content)
        await file.seek(0)
    
    if total_size > 20 * 1024 * 1024:
        raise HTTPException(
            status_code=400,
            detail="Total file size exceeds 20MB limit"
        )

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

    db = next(get_db())
    db_file = File(id=file_id, content=file_content, filename=filename)
    db.add(db_file)
    db.commit()

    return {"id": file_id}

@app.get("/download/{file_id}")
async def download_file(file_id: str):
    db = next(get_db())
    file = db.query(File).filter(File.id == file_id).first()
    
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    
    headers = {"Content-Disposition": f'attachment; filename="{file.filename}"'}
    
    extension = os.path.splitext(file.filename)[1].lower()
    content_type = "application/octet-stream"
    if extension == '.zip':
        content_type = "application/zip"
    elif extension in ['.pdf', '.txt', '.jpg', '.png', '.jpeg']:
        content_types = {
            '.pdf': 'application/pdf',
            '.txt': 'text/plain',
            '.jpg': 'image/jpeg',
            '.jpeg': 'image/jpeg',
            '.png': 'image/png'
        }
        content_type = content_types.get(extension, "application/octet-stream")
    
    return StreamingResponse(
        io.BytesIO(file.content),
        media_type=content_type,
        headers=headers
    ) 