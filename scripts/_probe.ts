import { fal } from "@fal-ai/client";
async function try1(input: any, label: string) {
  try {
    const r: any = await fal.subscribe("bytedance/seedance-2.0/fast/text-to-video", { input, logs: false });
    console.log(label, "OK", JSON.stringify(r?.data ?? r).slice(0,200));
    return true;
  } catch (e: any) {
    console.log(label, "STATUS", e.status, "DETAIL", JSON.stringify(e.body?.detail));
    return false;
  }
}
async function main() {
  await try1({ prompt: "test", resolution: "720p", duration: "5", aspect_ratio: "16:9", generate_audio: false }, "A(str dur)");
}
main();
