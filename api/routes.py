from fastapi import APIRouter, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from models import SessionLocal, Base, engine
from controllers import save_files_to_db, get_file_from_db, get_content_type, get_encoded_filename
import io

router = APIRouter()

@router.post("/upload")
async def upload_files(files: list[UploadFile]):
    file_id, error = await save_files_to_db(files, SessionLocal)
    if error:
        raise HTTPException(status_code=400, detail=error)
    return {"id": file_id}

@router.get("/download/{file_id}")
async def download_file(file_id: str):
    file = get_file_from_db(file_id, SessionLocal)
    if not file:
        raise HTTPException(status_code=404, detail="File not found")
    encoded_filename = get_encoded_filename(file.filename)
    headers = {
        "Content-Disposition": f'attachment; filename*=UTF-8\'\'{encoded_filename}',
        "Access-Control-Expose-Headers": "Content-Disposition"
    }
    content_type = get_content_type(file.filename)
    return StreamingResponse(
        io.BytesIO(file.content),
        media_type=content_type,
        headers=headers
    ) 