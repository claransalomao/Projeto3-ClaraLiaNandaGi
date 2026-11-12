import json
import os
import urllib.error
import urllib.request
from pathlib import Path

URL_BASE = 'https://generativelanguage.googleapis.com/v1beta/models'
ARQUIVO_ENV = Path(__file__).resolve().parent.parent / '.env'


class GeminiError(Exception):
    def __init__(self, mensagem, status=502):
        super().__init__(mensagem)
        self.status = status


def _variavel(nome, padrao=None):
    """Lê do ambiente; se não tiver, procura no backend/.env (sem python-dotenv)."""
    if os.environ.get(nome):
        return os.environ[nome]
    if ARQUIVO_ENV.exists():
        for linha in ARQUIVO_ENV.read_text(encoding='utf-8').splitlines():
            if '=' in linha and not linha.strip().startswith('#'):
                chave, valor = linha.split('=', 1)
                if chave.strip() == nome:
                    return valor.strip().strip('"') or padrao
    return padrao


def gerar_json(prompt, schema, instrucao_sistema=None):
    chave = _variavel('GEMINI_API_KEY')
    if not chave:
        raise GeminiError('GEMINI_API_KEY não configurada no backend/.env', status=500)
    modelo = _variavel('GEMINI_MODEL', 'gemini-2.5-flash')

    corpo = {
        'contents': [{'role': 'user', 'parts': [{'text': prompt}]}],
        'generationConfig': {
            'temperature': 0.4,
            'responseMimeType': 'application/json',
            'responseSchema': schema,
        },
    }
    if instrucao_sistema:
        corpo['systemInstruction'] = {'parts': [{'text': instrucao_sistema}]}

    requisicao = urllib.request.Request(
        f'{URL_BASE}/{modelo}:generateContent',
        data=json.dumps(corpo).encode('utf-8'),
        headers={'Content-Type': 'application/json', 'x-goog-api-key': chave},
        method='POST',
    )

    try:
        with urllib.request.urlopen(requisicao, timeout=60) as resposta:
            dados = json.loads(resposta.read().decode('utf-8'))
    except urllib.error.HTTPError as erro:
        if erro.code == 429:
            raise GeminiError('Limite gratuito do Gemini atingido. Espere um pouco e tente de novo.', status=429)
        raise GeminiError(f'Erro {erro.code} do Gemini: {erro.read().decode()[:300]}')
    except urllib.error.URLError as erro:
        raise GeminiError(f'Não foi possível conectar ao Gemini: {erro}')

    try:
        texto = dados['candidates'][0]['content']['parts'][0]['text']
        return json.loads(texto)
    except (KeyError, IndexError, json.JSONDecodeError):
        raise GeminiError('O Gemini devolveu uma resposta em formato inesperado.')