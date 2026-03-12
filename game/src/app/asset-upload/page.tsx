"use client";

import { useState, useCallback, useRef } from "react";

const CATEGORIES = ["Characters", "UI", "Effects", "Backgrounds", "Icons"] as const;
const SUBCATEGORIES: Record<string, string[]> = {
  Characters: ["hero_base", "hero_epic", "hero_closeup", "portrait", "chibi"],
  UI: ["button", "panel", "icon", "badge", "frame"],
  Effects: ["particle", "glow", "explosion", "aura", "lightning"],
  Backgrounds: ["arena", "menu", "loading", "result", "stage"],
  Icons: ["currency", "status", "skill", "item", "rank"],
};

const SIZES = [2048, 1024, 512] as const;

interface UploadResult {
  filename: string;
  sizes: number[];
  status: "pending" | "done" | "error";
}

export default function AssetUploadPage() {
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [subcategory, setSubcategory] = useState<string>("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string>("");
  const [results, setResults] = useState<UploadResult[]>([]);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    const reader = new FileReader();
    reader.onload = (ev) => setPreview(ev.target?.result as string);
    reader.readAsDataURL(f);
  }, []);

  const handleUpload = useCallback(async () => {
    if (!file || !subcategory) return;
    setUploading(true);

    const timestamp = Date.now();
    const baseName = `${category.toLowerCase()}_${subcategory}_${timestamp}`;

    // HOOK: Replace with actual GitHub API upload
    // For each size, resize and push to GitHub:
    //
    // const canvas = document.createElement('canvas');
    // canvas.width = size; canvas.height = size;
    // const ctx = canvas.getContext('2d');
    // ctx.drawImage(img, 0, 0, size, size);
    // const blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
    //
    // await fetch(`https://api.github.com/repos/OWNER/REPO/contents/assets/${category}/${baseName}_${size}.png`, {
    //   method: 'PUT',
    //   headers: { Authorization: `Bearer ${GITHUB_TOKEN}`, 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ message: `Upload ${baseName}`, content: base64data })
    // });

    const result: UploadResult = {
      filename: baseName,
      sizes: [...SIZES],
      status: "done",
    };

    // Simulate upload delay
    await new Promise((r) => setTimeout(r, 1500));

    setResults((prev) => [result, ...prev]);
    setFile(null);
    setPreview("");
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  }, [file, category, subcategory]);

  return (
    <div className="min-h-screen p-6" style={{ background: "#050d1a" }}>
      <div className="max-w-lg mx-auto">
        <h1 className="text-2xl font-black mb-6" style={{ color: "#00d4ff" }}>
          Asset Upload
        </h1>

        {/* Category */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 opacity-60">Category</label>
          <select
            value={category}
            onChange={(e) => {
              setCategory(e.target.value);
              setSubcategory("");
            }}
            className="w-full p-3 rounded-lg text-white"
            style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>

        {/* Subcategory */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 opacity-60">Subcategory</label>
          <select
            value={subcategory}
            onChange={(e) => setSubcategory(e.target.value)}
            className="w-full p-3 rounded-lg text-white"
            style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
          >
            <option value="">Select...</option>
            {(SUBCATEGORIES[category] || []).map((s) => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
        </div>

        {/* File upload */}
        <div className="mb-4">
          <label className="block text-sm font-semibold mb-2 opacity-60">Image</label>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="w-full p-3 rounded-lg text-white"
            style={{ background: "#0a1628", border: "1px solid rgba(255,255,255,0.1)" }}
          />
        </div>

        {/* Preview */}
        {preview && (
          <div className="mb-4 rounded-lg overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.1)" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={preview} alt="Preview" className="w-full h-auto" />
          </div>
        )}

        {/* Size info */}
        <div className="mb-4 text-xs opacity-40">
          Auto-resize to: {SIZES.join(", ")}px. Auto-rename: {category.toLowerCase()}_{subcategory || "sub"}_timestamp.png
        </div>

        {/* Upload button */}
        <button
          onClick={handleUpload}
          disabled={!file || !subcategory || uploading}
          className="w-full py-3 rounded-lg font-bold text-lg disabled:opacity-40"
          style={{
            background: uploading ? "#333" : "linear-gradient(135deg, #00d4ff, #0090cc)",
            color: "#011",
          }}
        >
          {uploading ? "Uploading..." : "Upload & Push to GitHub"}
        </button>

        {/* Results */}
        {results.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-bold mb-3 opacity-60">Upload History</h2>
            {results.map((r, i) => (
              <div key={i} className="p-3 rounded-lg mb-2 text-sm"
                   style={{ background: "rgba(0,255,136,0.05)", border: "1px solid rgba(0,255,136,0.1)" }}>
                <div className="font-bold" style={{ color: "#00ff88" }}>{r.filename}</div>
                <div className="opacity-50">Sizes: {r.sizes.join(", ")}px — {r.status}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
