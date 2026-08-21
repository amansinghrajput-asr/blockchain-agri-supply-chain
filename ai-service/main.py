from fastapi import FastAPI, File, UploadFile, HTTPException
import cv2, numpy as np

app=FastAPI(title="AgriChain AI Quality Service")

@app.get("/health")
def health(): return {"ok": True, "service": "quality-ai"}

@app.post("/assess")
async def assess(image: UploadFile = File(...)):
    data=await image.read()
    arr=np.frombuffer(data,np.uint8)
    img=cv2.imdecode(arr,cv2.IMREAD_COLOR)
    if img is None: raise HTTPException(400,"Invalid image")
    # Baseline visual-quality heuristic: blur, brightness and saturation.
    gray=cv2.cvtColor(img,cv2.COLOR_BGR2GRAY)
    sharp=float(cv2.Laplacian(gray,cv2.CV_64F).var())
    hsv=cv2.cvtColor(img,cv2.COLOR_BGR2HSV)
    sat=float(np.mean(hsv[:,:,1])); bright=float(np.mean(hsv[:,:,2]))
    sharp_score=min(100, sharp/8)
    sat_score=max(0,min(100, sat*1.3))
    bright_score=max(0,100-abs(bright-145)*0.8)
    score=round(0.45*sharp_score+0.3*sat_score+0.25*bright_score,2)
    grade="A" if score>=80 else "B" if score>=65 else "C" if score>=50 else "D"
    return {"score":score,"grade":grade,"metrics":{"sharpness":round(sharp,2),"saturation":round(sat,2),"brightness":round(bright,2)},"explanation":"OpenCV baseline quality assessment. Replace/augment with trained YOLOv8/TensorFlow model for production crop classification."}
