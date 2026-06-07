import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const p = (file) => path.join(root, file);
const read = (file) => fs.existsSync(p(file)) ? fs.readFileSync(p(file), "utf8") : "";
const write = (file, content) => fs.writeFileSync(p(file), content);

function patchApp() {
  const file = "src/App.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('ProviderChoice from "./pages/ProviderChoice"')) src = src.replace('import Index from "./pages/Index";', 'import Index from "./pages/Index";\nimport ProviderChoice from "./pages/ProviderChoice";');
  if (!src.includes('path="/providers"')) src = src.replace('<Route path="/" element={<Index />} />', '<Route path="/" element={<Index />} /><Route path="/providers" element={<ProviderChoice />} />');
  src = src.replace('<Route path="/family/memorials/customize" element={<ProFeatureRoute><MemorialCustomize /></ProFeatureRoute>} />', '<Route path="/family/memorials/customize" element={<ProtectedRoute allowedRoles={["family"]}><MemorialCustomize /></ProtectedRoute>} />');
  src = src.replace('<Route path="/family/memorials/design" element={<ProFeatureRoute><MemorialDesign /></ProFeatureRoute>} />', '<Route path="/family/memorials/design" element={<ProtectedRoute allowedRoles={["family"]}><MemorialDesign /></ProtectedRoute>} />');
  write(file, src);
}

function patchIndex() {
  const file = "src/pages/Index.tsx";
  let src = read(file);
  if (!src) return;
  src = src.replace('to="/signup/home" className="btn-struta-primary h-14 px-8 flex items-center justify-center text-lg">For Providers</Link>', 'to="/providers" className="btn-struta-primary h-14 px-8 flex items-center justify-center text-lg">For Providers</Link>');
  src = src.replace('<span className="section-tag">Every Service</span><h2 className="text-[var(--ink)] text-4xl">All funeral services, one platform</h2>', '<span className="section-tag">Every Service</span><h2 className="text-[var(--ink)] text-4xl">All funeral services, one platform</h2><p className="text-sm md:text-base text-[var(--muted)] max-w-2xl mx-auto mt-3 font-semibold">Services shown depend on what each funeral home or vendor offers, so families only see relevant support options from real providers.</p>');
  write(file, src);
}

function patchCreateMemorial() {
  const file = "src/features/memorial/pages/CreateMemorial.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('compressImageFile')) {
    src = src.replace('const maxSizeBytes = 5 * 1024 * 1024;', `const maxSizeBytes = 5 * 1024 * 1024;
const galleryLimit = 5;

const compressImageFile = async (file: File, maxWidth = 1600, quality = 0.78): Promise<File> => {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = reject;
      image.src = imageUrl;
    });
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(imageUrl); }
};`);
  }
  src = src.replace(/const galleryLimit = profile\?\.isPro \? 50 : 5;/g, 'const maxGalleryPhotos = galleryLimit;');
  if (!src.includes('const maxGalleryPhotos = galleryLimit;')) src = src.replace('const generatedSlug = useMemo', 'const maxGalleryPhotos = galleryLimit;\n  const generatedSlug = useMemo');
  src = src.replace(/if \(!profile\?\.isPro && count && count >= 1\) \{[\s\S]*?navigate\("\/family\/billing"\);\n\s*\}/g, '');
  src = src.replace(/profile\?\.isPro \? "Gallery limit reached\." : "Free memorials allow up to 5 gallery photos\. Upgrade for more\."/g, '"Gallery allows up to 5 compressed photos."');
  src = src.replace(/formData\.gallery\.length >= galleryLimit/g, 'formData.gallery.length >= maxGalleryPhotos');
  src = src.replace(/const compressedFile = await compressImageFile\(file\);\n\s*const compressedFile = await compressImageFile\(file\);/g, 'const compressedFile = await compressImageFile(file);');
  src = src.replace(/const url = await uploadFile\(file, type\);/g, 'const compressedFile = await compressImageFile(file);\n      const url = await uploadFile(compressedFile, type);');
  src = src.replace(/profile\?\.isPro \? "Unlimited" : "5"/g, '"5"');
  src = src.replace(/formData\.gallery\.length < galleryLimit/g, 'formData.gallery.length < maxGalleryPhotos');
  src = src.replace('showSuccess(content ? "AI draft created." : "Draft created. Connect Family Pro AI for richer results.");', 'showSuccess(content ? "AI draft created." : "Draft created from the memorial details.");');
  write(file, src);
}

function patchEditMemorial() {
  const file = "src/features/bereaved/components/EditMemorialDialog.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('compressImageFile')) {
    src = src.replace('interface EditMemorialDialogProps { memorial: any; isOpen: boolean; onClose: () => void; onUpdate: (updatedMemorial: any) => void; }', `interface EditMemorialDialogProps { memorial: any; isOpen: boolean; onClose: () => void; onUpdate: (updatedMemorial: any) => void; }
const galleryLimit = 5;
const compressImageFile = async (file: File, maxWidth = 1600, quality = 0.78): Promise<File> => {
  if (!file.type.startsWith("image/") || file.type === "image/gif") return file;
  const imageUrl = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => { const image = new Image(); image.onload = () => resolve(image); image.onerror = reject; image.src = imageUrl; });
    const scale = Math.min(1, maxWidth / img.width);
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(img.width * scale);
    canvas.height = Math.round(img.height * scale);
    const ctx = canvas.getContext("2d");
    if (!ctx) return file;
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", quality));
    if (!blob) return file;
    return new File([blob], file.name.replace(/\.[^.]+$/, ".jpg"), { type: "image/jpeg" });
  } finally { URL.revokeObjectURL(imageUrl); }
};`);
  }
  src = src.replace(/const fileExt = file\.name\.split\('\.'\)\.pop\(\);\n\s*const compressedFile = await compressImageFile\(file\);\n\s*const fileExt = compressedFile\.name\.split\('\.'\)\.pop\(\);/g, 'const compressedFile = await compressImageFile(file);\n      const fileExt = compressedFile.name.split(\'.\').pop();');
  src = src.replace(/const fileExt = file\.name\.split\('\.'\)\.pop\(\);\n\s*const fileName = `\$\{memorial\.id\}\/\$\{type\}-\$\{Date\.now\(\)\}\.\$\{fileExt\}`;/g, 'const compressedFile = await compressImageFile(file);\n      const fileExt = compressedFile.name.split(\'.\').pop();\n      const fileName = `${memorial.id}/${type}-${Date.now()}.${fileExt}`;');
  src = src.replace(/const compressedFile = await compressImageFile\(file\);\n\s*const compressedFile = await compressImageFile\(file\);/g, 'const compressedFile = await compressImageFile(file);');
  src = src.replace(/\.upload\(fileName, file,/g, '.upload(fileName, compressedFile,');
  src = src.replace(/if \(type === 'gallery'\) setFormData\(prev => \(\{ \.\.\.prev, gallery: \[\.\.\.prev\.gallery, finalUrl\] \}\)\);/g, 'if (type === \'gallery\') { if (formData.gallery.length >= galleryLimit) return showError("Gallery allows up to 5 compressed photos."); setFormData(prev => ({ ...prev, gallery: [...prev.gallery, finalUrl] })); }');
  src = src.replace(/Memory Gallery \(\{formData\.gallery\.length\}\/Unlimited\)/g, 'Memory Gallery ({formData.gallery.length}/5)');
  write(file, src);
}

function patchChat() {
  const file = "src/components/ResponsiveChatHub.tsx";
  let src = read(file);
  if (!src) return;
  if (!src.includes('formatPresenceStatus')) src = src.replace('const getProviderIcon = (type: string) => type === "vendor" ? <Store className="w-5 h-5" /> : <Building2 className="w-5 h-5" />;', 'const getProviderIcon = (type: string) => type === "vendor" ? <Store className="w-5 h-5" /> : <Building2 className="w-5 h-5" />;\nconst formatPresenceStatus = (thread: ChatThread) => {\n  const updated = new Date(thread.updated_at);\n  const minutes = Math.max(0, Math.round((Date.now() - updated.getTime()) / 60000));\n  if (minutes < 5) return "Online now";\n  if (minutes < 60) return `Active ${minutes} min ago`;\n  return `Last active ${updated.toLocaleDateString()} ${updated.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;\n};');
  src = src.replace('{subtitle(selectedThread)}</p></div></div><div ref={scrollRef}', '{subtitle(selectedThread)} · {formatPresenceStatus(selectedThread)}</p></div></div><div ref={scrollRef}');
  write(file, src);
}

patchApp();
patchIndex();
patchCreateMemorial();
patchEditMemorial();
patchChat();
