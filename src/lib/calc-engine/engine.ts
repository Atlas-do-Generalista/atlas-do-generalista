import type { Calculadora, ContextoPaciente, ResultadoDisponivel } from './types';

function campoAusente(valor: unknown): boolean {
  return valor === null || valor === undefined || valor === '';
}

export function calcularDisponiveis(
  dados: ContextoPaciente,
  registry: readonly Calculadora[],
): ResultadoDisponivel[] {
  return registry.map((calc): ResultadoDisponivel => {
    const faltando = calc.obterEntradasFaltantes
      ? [...calc.obterEntradasFaltantes(dados)]
      : calc.entradas.filter((campo) => campoAusente(dados[campo]));

    if (faltando.length > 0) {
      return { calc, status: 'incompleto', faltando };
    }

    const problemas = calc.validar?.(dados) ?? [];
    if (problemas.length > 0) {
      return { calc, status: 'erro', erro: problemas.join(' ') };
    }

    try {
      return { calc, status: 'ok', resultado: calc.calcular(dados) };
    } catch (error) {
      const mensagem = error instanceof Error ? error.message : 'Erro desconhecido.';
      return { calc, status: 'erro', erro: mensagem };
    }
  });
}
