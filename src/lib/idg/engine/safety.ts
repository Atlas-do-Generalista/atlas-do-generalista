import type { IDGState, ClinicalSafetyAlert } from '../types';
import { IDGKnowledgeRegistry } from '../knowledge/registry';

export function evaluateSafetyAlerts(state: IDGState): ClinicalSafetyAlert[] {
  const allAlerts = IDGKnowledgeRegistry.getAllAlerts();
  const triggeredAlerts: ClinicalSafetyAlert[] = [];

  for (const alert of allAlerts) {
    // Um alerta dispara imediatamente se ao menos um ou todos os achados engatilhadores forem positivos
    const matchesAllRequired = alert.triggeredByFindings.every(
      (findingId) => state.findings[findingId] === 'presente',
    );

    if (matchesAllRequired && alert.triggeredByFindings.length > 0) {
      triggeredAlerts.push(alert);
    }
  }

  // Ordena por severidade: crítica primeiro
  return triggeredAlerts.sort((a, b) => {
    if (a.severity === 'critica' && b.severity !== 'critica') return -1;
    if (b.severity === 'critica' && a.severity !== 'critica') return 1;
    return 0;
  });
}
