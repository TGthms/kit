export function fileMatchesAccept(file: File, accept?: string): boolean {
  if (!accept) return true;
  const name = file.name.toLowerCase();
  return accept.split(",").some((raw) => {
    const part = raw.trim().toLowerCase();
    if (!part) return false;
    if (part.endsWith("/*")) {
      const prefix = part.slice(0, -1);
      if (file.type.toLowerCase().startsWith(prefix)) return true;
      if (part === "image/*") {
        return /\.(png|jpe?g|gif|webp|bmp|heic|tiff?)$/.test(name);
      }
      if (part === "audio/*") {
        return /\.(mp3|wav|wave|ogg|oga|flac|aac|m4a|opus|weba|aiff?)$/.test(name);
      }
      if (part === "video/*") {
        return /\.(mp4|webm|mov|mkv|avi|m4v|ogv|gif)$/.test(name);
      }
      return false;
    }
    if (part.startsWith(".")) return name.endsWith(part);
    if (part === "application/pdf") {
      return file.type === "application/pdf" || name.endsWith(".pdf");
    }
    return file.type.toLowerCase() === part;
  });
}
