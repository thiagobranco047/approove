export const CLIENT_VISIBLE_PRODUCTION_STAGE = "ready_for_client";

export function isPostVisibleToClient(productionStage: string): boolean {
  return productionStage === CLIENT_VISIBLE_PRODUCTION_STAGE;
}
