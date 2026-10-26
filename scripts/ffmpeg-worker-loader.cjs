/** FFmpeg 0.12.15's optional custom worker is a runtime URL, not a bundled
 * module. Next 16.4 tries to resolve new URL(dynamic, import.meta.url) at build
 * time. Use the equivalent native URL construction for only that optional
 * branch; keep the default static worker constructor and bundling untouched.
 * Fail closed when an SDK upgrade changes this exact integration point. */
module.exports = function ffmpegWorkerLoader(source) {
  const needle = "new URL(classWorkerURL, import.meta.url)";
  if (source.split(needle).length !== 2) {
    throw new Error("FFmpeg worker integration changed. Review the scoped loader before upgrading.");
  }
  return source.replace(needle, "Reflect.construct(URL, [classWorkerURL, import.meta.url])");
};
