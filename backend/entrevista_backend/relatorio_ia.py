"""Lógica de IA do relatório final da entrevista (usa gerar_json de gemini.py)."""
from .gemini import gerar_json

CRITERIOS = ['Clareza', 'Conteúdo técnico', 'Comunicação', 'Estrutura (STAR)']

SCHEMA_RELATORIO = {
    'type': 'OBJECT',
    'properties': {
        'resumo': {
            'type': 'STRING',
            'description': 'Duas frases sobre o desempenho geral, em segunda pessoa.',
        },
        'criterios': {
            'type': 'ARRAY',
            'items': {
                'type': 'OBJECT',
                'properties': {
                    'nome': {'type': 'STRING', 'enum': CRITERIOS},
                    'nota': {'type': 'NUMBER', 'description': 'Nota de 0 a 10, uma casa decimal.'},
                },
                'required': ['nome', 'nota'],
            },
        },
        'pontos_melhorar': {
            'type': 'ARRAY',
            'items': {'type': 'STRING'},
            'description': 'Exatamente 3 recomendações curtas, concretas e acionáveis.',
        },
    },
    'required': ['resumo', 'criterios', 'pontos_melhorar'],
}

INSTRUCAO_SISTEMA = (
    'Você é um coach de carreira que avalia entrevistas simuladas em português do Brasil. '
    'Seja específico e honesto, baseado no que o candidato realmente respondeu, sem elogios '
    'genéricos. Use a nota de 0 a 10 com rigor (7 é bom, 9 ou mais só para desempenho excelente).'
)


def _limitar(nota):
    return round(max(0.0, min(10.0, float(nota))), 1)


def gerar_relatorio(entrevista):
    """Analisa a entrevista inteira e devolve resumo, notas por critério e 3 pontos a melhorar."""
    linhas = [
        f'Área: {entrevista.area}',
        f'Nível: {entrevista.nivel}',
        f'Tipos de entrevista: {", ".join(entrevista.tipos)}',
        f'Entrevistador: {entrevista.get_entrevistador_display()}',
        '\nPerguntas, respostas e feedback de cada resposta:',
    ]
    for p in entrevista.perguntas.all():
        if p.pulada:
            linhas.append(f'{p.ordem}. {p.texto}\n   Resposta: (pulou a pergunta)')
        elif p.respondida_em:
            linhas.append(
                f'{p.ordem}. {p.texto}\n'
                f'   Resposta: {p.resposta}\n'
                f'   Nota: {p.nota} | Pontos fortes: {p.pontos_fortes} | '
                f'O que melhorar: {p.o_que_melhorar}'
            )

    prompt = (
        '\n'.join(linhas)
        + '\n\nFaça o relatório final desta entrevista. Dê uma nota para cada um destes '
        f'critérios: {", ".join(CRITERIOS)}. Em "Estrutura (STAR)", avalie se as histórias '
        'têm situação, tarefa, ação e resultado. Em "Conteúdo técnico", avalie a profundidade '
        'e a correção do conteúdo para a área. Os 3 pontos para melhorar devem mostrar padrões '
        'que se repetem nas respostas, não problemas de uma resposta só.'
    )
    resultado = gerar_json(prompt, SCHEMA_RELATORIO, INSTRUCAO_SISTEMA)

    # Garante os 4 critérios, na ordem certa, mesmo se a IA repetir ou esquecer algum
    notas = {c['nome']: _limitar(c['nota']) for c in resultado['criterios'] if c['nome'] in CRITERIOS}
    criterios = [{'nome': nome, 'nota': notas.get(nome)} for nome in CRITERIOS]

    return {
        'resumo': resultado['resumo'],
        'criterios': criterios,
        'pontos_melhorar': resultado['pontos_melhorar'][:3],
    }