"""Lógica de IA da sessão de entrevista (usa gerar_json de gemini.py)."""
import json

from .gemini import gerar_json

PERSONAS = {
    'rh': (
        'Você é uma recrutadora de RH simpática e acolhedora. Seu foco é fit cultural, '
        'trajetória, motivação e soft skills. Deixa o candidato à vontade, mas espera '
        'respostas concretas.'
    ),
    'gestor': (
        'Você é um gestor técnico exigente. Aprofunda as respostas, pede detalhes, '
        'questiona escolhas e cobra justificativas e resultados concretos.'
    ),
    'case': (
        'Você é um entrevistador de consultoria/banco de investimento. Testa raciocínio '
        'estruturado sob pressão, com cases, estimativas e perguntas de mercado. É direto '
        'e objetivo.'
    ),
}

SCHEMA_PERGUNTA = {
    'type': 'OBJECT',
    'properties': {
        'tema': {'type': 'STRING', 'description': 'Título curto da pergunta (2 a 4 palavras).'},
        'pergunta': {'type': 'STRING', 'description': 'A pergunta, como o entrevistador falaria.'},
        'follow_up': {'type': 'BOOLEAN', 'description': 'true se aprofunda a resposta anterior.'},
    },
    'required': ['tema', 'pergunta', 'follow_up'],
}

SCHEMA_FEEDBACK = {
    'type': 'OBJECT',
    'properties': {
        'nota': {'type': 'NUMBER', 'description': 'Nota de 0 a 10, com uma casa decimal.'},
        'pontos_fortes': {'type': 'STRING', 'description': 'Uma ou duas frases.'},
        'o_que_melhorar': {'type': 'STRING', 'description': 'Uma ou duas frases.'},
        'resposta_modelo': {'type': 'STRING', 'description': 'Uma resposta exemplar curta.'},
    },
    'required': ['nota', 'pontos_fortes', 'o_que_melhorar', 'resposta_modelo'],
}


def _instrucao_sistema(entrevista):
    return (
        PERSONAS[entrevista.entrevistador]
        + ' Você está conduzindo uma entrevista simulada em português do Brasil, '
        'para treinar o candidato. Faça uma pergunta por vez, curta e natural, '
        'adequada à área, ao nível e aos tipos de entrevista escolhidos. '
        'Nunca repita uma pergunta já feita.'
    )


def _contexto(entrevista):
    """Configuração da entrevista + vaga + histórico de perguntas e respostas."""
    linhas = [
        f'Área: {entrevista.area}',
        f'Nível: {entrevista.nivel}',
        f'Tipos de entrevista: {", ".join(entrevista.tipos)}',
        f'Total de perguntas: {entrevista.num_perguntas}',
    ]
    if entrevista.analise_vaga:
        linhas.append('Análise da vaga-alvo: '
                      + json.dumps(entrevista.analise_vaga.resultado, ensure_ascii=False))
    elif entrevista.vaga:
        linhas.append(f'Descrição da vaga-alvo:\n{entrevista.vaga}')

    feitas = [p for p in entrevista.perguntas.all() if p.respondida_em or p.pulada]
    if feitas:
        linhas.append('\nHistórico da entrevista até agora:')
        for p in feitas:
            resposta = '(pulou a pergunta)' if p.pulada else p.resposta
            linhas.append(f'{p.ordem}. Entrevistador: {p.texto}\n   Candidato: {resposta}')
    return '\n'.join(linhas)


def gerar_pergunta(entrevista):
    """Gera a próxima pergunta, levando em conta o que já foi perguntado e respondido."""
    proxima = entrevista.perguntas.count() + 1
    if proxima == 1:
        orientacao = ('Esta é a primeira pergunta. Comece com uma abertura natural para o '
                      'tipo de entrevista (por exemplo, pedir para o candidato se apresentar).')
    elif proxima == entrevista.num_perguntas:
        orientacao = 'Esta é a última pergunta da entrevista.'
    else:
        orientacao = ('Se a última resposta deixou algo vago ou interessante, faça um '
                      'follow-up sobre ela (follow_up = true). Caso contrário, mude de tema '
                      'para cobrir os tipos de entrevista escolhidos (follow_up = false).')

    prompt = (
        f'{_contexto(entrevista)}\n\n'
        f'Gere a pergunta {proxima} de {entrevista.num_perguntas}. {orientacao}'
    )
    resultado = gerar_json(prompt, SCHEMA_PERGUNTA, _instrucao_sistema(entrevista))
    if proxima == 1:
        resultado['follow_up'] = False
    return resultado


def avaliar_resposta(entrevista, pergunta, resposta):
    """Dá nota e feedback para a resposta do candidato a uma pergunta."""
    prompt = (
        f'{_contexto(entrevista)}\n\n'
        f'Avalie a resposta do candidato à pergunta abaixo, considerando o nível '
        f'"{entrevista.nivel}". Use a nota de 0 a 10 com rigor (7 é uma resposta boa, '
        f'9 ou mais só para respostas excelentes). Em perguntas comportamentais, '
        f'considere a estrutura STAR (situação, tarefa, ação, resultado). '
        f'Seja específico sobre esta resposta, sem elogios genéricos.\n\n'
        f'Pergunta: {pergunta.texto}\n'
        f'Resposta do candidato: {resposta}'
    )
    resultado = gerar_json(prompt, SCHEMA_FEEDBACK, _instrucao_sistema(entrevista))
    resultado['nota'] = round(max(0.0, min(10.0, float(resultado['nota']))), 1)
    return resultado