from fastapi import FastAPI, UploadFile, File, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from langchain_community.document_loaders import PyPDFLoader
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from langchain.text_splitter import RecursiveCharacterTextSplitter
from dotenv import load_dotenv
import os
import tempfile
import requests
import logging
import shutil

app = FastAPI()
load_dotenv()


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)


EMBEDDING_MODEL = "sentence-transformers/all-MiniLM-L6-v2"
DEEPSEEK_MODEL = "deepseek/deepseek-chat-v3-0324:free"  # Free model
PERSIST_DIR = "./pdf_chroma_db"  # Different folder for general PDFs

# Create directory if not exists
os.makedirs(PERSIST_DIR, exist_ok=True)


embeddings = HuggingFaceEmbeddings(model_name=EMBEDDING_MODEL)

@app.post("/upload")
async def upload_pdf(file: UploadFile = File(...)):
    tmp_path = None
    try:
        logger.info(f"Received upload request for file: {file.filename}")
        
        
        temp_dir = tempfile.mkdtemp()
        tmp_path = os.path.join(temp_dir, file.filename)
        
        
        with open(tmp_path, "wb") as f:
            content = await file.read()
            f.write(content)
            logger.info(f"Saved file to temp location: {tmp_path} ({len(content)} bytes)")

        
        loader = PyPDFLoader(tmp_path)
        pages = loader.load()
        logger.info(f"Loaded {len(pages)} pages from PDF")
        
        text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)
        chunks = text_splitter.split_documents(pages)
        logger.info(f"Split PDF into {len(chunks)} chunks")

       
        vector_store = Chroma.from_documents(
            documents=chunks,
            embedding=embeddings,
            persist_directory=PERSIST_DIR,
            collection_name="uploaded_pdfs"
        )
        vector_store.persist()
        logger.info(f"Persisted vector store to {PERSIST_DIR}")

        return {"message": f"PDF uploaded successfully! {len(chunks)} chunks processed"}

    except Exception as e:
        logger.error(f"Upload failed: {str(e)}", exc_info=True)
        raise HTTPException(500, f"Processing error: {str(e)}")
    finally:
        # Clean up temp files
        if tmp_path and os.path.exists(tmp_path):
            os.unlink(tmp_path)
            logger.info("Cleaned up temporary files")

@app.get("/ask")
async def ask(question: str):
    try:
        
        vector_store = Chroma(
            persist_directory=PERSIST_DIR,
            embedding_function=embeddings,
            collection_name="uploaded_pdfs"
        )
        docs = vector_store.similarity_search(question, k=3)
        context = "\n\n".join([doc.page_content for doc in docs])

        
        headers = {
            "Authorization": "Bearer sk-or-v1-0XCXCXCXCXCXCXCXC6f4cea8057573b7ef43a33e8a6", 
            "HTTP-Referer": "http://localhost:8000",
            "X-Title": "ChatPDF"
        }

        
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers=headers,
            json={
                "model": DEEPSEEK_MODEL,
                "messages": [
                    {"role": "system", "content": f"Use this PDF: {context}"},
                    {"role": "user", "content": question}
                ]
            }
        )

        return {"answer": response.json()["choices"][0]["message"]["content"]}
        
    except Exception as e:
        return {"error": str(e)}