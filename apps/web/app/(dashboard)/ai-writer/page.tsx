import { AiWriterClient } from "./ai-writer-client";
import { checkAiAvailability } from "@/lib/actions/ai";

export default async function AiWriterPage() {
  const result = await checkAiAvailability();
  const configured = result.success ? result.data.configured : false;

  return <AiWriterClient configured={configured} />;
}
