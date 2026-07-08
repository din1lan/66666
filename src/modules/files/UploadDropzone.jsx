import { useRef, useState } from 'react'
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { storage, db, auth } from '../../firebase.js'

export default function UploadDropzone({ caseId }) {
  const [dragOver, setDragOver] = useState(false)
  const [uploads, setUploads] = useState([]) // { name, progress, error }
  const inputRef = useRef(null)

  function handleFiles(fileList) {
    const files = Array.from(fileList).filter((f) => f.type === 'application/pdf')
    if (files.length !== fileList.length) {
      window.alert('目前原型僅支援 PDF 檔案，其餘檔案已略過。')
    }
    files.forEach(uploadOne)
  }

  function uploadOne(file) {
    const path = `cases/${caseId}/${Date.now()}_${file.name}`
    const storageRef = ref(storage, path)
    const task = uploadBytesResumable(storageRef, file)

    setUploads((u) => [...u, { name: file.name, progress: 0, error: null }])

    task.on(
      'state_changed',
      (snap) => {
        const progress = Math.round((snap.bytesTransferred / snap.totalBytes) * 100)
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, progress } : x)))
      },
      (err) => {
        setUploads((u) => u.map((x) => (x.name === file.name ? { ...x, error: err.message } : x)))
      },
      async () => {
        const url = await getDownloadURL(storageRef)
        await addDoc(collection(db, 'files'), {
          caseId,
          fileName: file.name,
          storagePath: path,
          url,
          size: file.size,
          uploadedBy: auth.currentUser?.uid ?? null,
          uploadedAt: serverTimestamp(),
        })
        setUploads((u) => u.filter((x) => x.name !== file.name))
      },
    )
  }

  return (
    <div
      onDragOver={(e) => {
        e.preventDefault()
        setDragOver(true)
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={(e) => {
        e.preventDefault()
        setDragOver(false)
        handleFiles(e.dataTransfer.files)
      }}
      onClick={() => inputRef.current?.click()}
      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
        dragOver ? 'border-indigo-400 bg-indigo-50' : 'border-slate-300 bg-slate-50 hover:bg-slate-100'
      }`}
    >
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple
        className="hidden"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
      />
      <div className="text-3xl mb-1">📄</div>
      <div className="text-sm text-slate-600">拖曳 PDF 卷宗到這裡，或點擊選擇檔案</div>
      <div className="text-xs text-slate-400 mt-1">上傳後將自動歸類於此案件的資料夾</div>

      {uploads.length > 0 && (
        <div className="mt-4 space-y-2 text-left">
          {uploads.map((u) => (
            <div key={u.name} className="text-xs">
              <div className="flex justify-between text-slate-500">
                <span className="truncate">{u.name}</span>
                <span>{u.error ? '失敗' : `${u.progress}%`}</span>
              </div>
              <div className="h-1.5 bg-slate-200 rounded overflow-hidden">
                <div
                  className={`h-full ${u.error ? 'bg-red-400' : 'bg-indigo-500'}`}
                  style={{ width: `${u.error ? 100 : u.progress}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
