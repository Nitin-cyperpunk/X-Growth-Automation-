import { AutomationClient } from "./automation-client";
import { checkN8nStatus, getWorkflowConfigs, getWorkflowExecutions } from "@/lib/actions/workflows";

export default async function AutomationPage() {
  const [statusResult, configsResult, executionsResult] = await Promise.all([
    checkN8nStatus(),
    getWorkflowConfigs(),
    getWorkflowExecutions({ limit: 20 }),
  ]);

  const configured = statusResult.success ? statusResult.data.configured : false;
  const configs = configsResult.success ? configsResult.data : [];
  const executions = executionsResult.success ? executionsResult.data : [];

  return (
    <AutomationClient
      configured={configured}
      initialConfigs={configs}
      initialExecutions={executions}
    />
  );
}
