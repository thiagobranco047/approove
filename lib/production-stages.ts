export const PRODUCTION_STAGES = [
  { value: "draft_copy", label: "Copy em produção" },
  { value: "waiting_design", label: "Aguardando design" },
  { value: "internal_review", label: "Revisão interna" },
  { value: "ready_for_client", label: "Pronto para cliente" },
] as const;

export type ProductionStage = (typeof PRODUCTION_STAGES)[number]["value"];

const STAGE_STYLES: Record<ProductionStage, string> = {
  draft_copy:
    "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400",
  waiting_design:
    "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400",
  internal_review:
    "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400",
  ready_for_client:
    "bg-teal-100 text-teal-700 dark:bg-teal-950 dark:text-teal-400",
};

export function isProductionStage(value: string): value is ProductionStage {
  return PRODUCTION_STAGES.some((stage) => stage.value === value);
}

export function getProductionStageLabel(stage: string): string {
  return PRODUCTION_STAGES.find((s) => s.value === stage)?.label ?? stage;
}

export function getProductionStageStyle(stage: string): string {
  if (isProductionStage(stage)) return STAGE_STYLES[stage];
  return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300";
}
