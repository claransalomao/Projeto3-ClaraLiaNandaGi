[README.md](https://github.com/user-attachments/files/34628777/README.md)
# Projeto3-ClaraLiaNandaGi
# Ensaio — Simulador de Entrevistas com IA
# Integrantes: Clara Salomão, Giovana Zani, Lia Haller, Maria Fernanda Morales

## Cronograma

### Sprint 1 (10/11 a 13/11)

**Entrega:** proposta validada, fluxo de telas, cadastro e login funcionando e entrevista por texto funcionando do início ao fim.

- [x] Validar a proposta com a professora
- [x] Criar o fluxo de telas
- [x] Configurar o backend e o frontend
- [x] Implementar cadastro e login
- [x] Implementar a análise da vaga com IA
- [x] Implementar a entrevista com IA
- [ ] Criar as telas de nova entrevista e de entrevista

### Sprint 2 (16/11 a 19/11)

**Entrega:** relatório de feedback, histórico, interface finalizada e deploy.

- [ ] Implementar o relatório de feedback com IA
- [ ] Criar a tela de relatório
- [ ] Criar a tela de histórico
- [ ] Finalizar a interface
- [ ] Fazer o deploy
## Tecnologias

- **Frontend:** React + Vite, React Router, axios e Tailwind CSS (`frontend/entrevista-frontend`)
- **Backend:** Django + Django REST Framework, com autenticação por token (`backend`)
- **Fluxo de telas:** [Proj. 3 - Fluxo de Telas.pdf](Proj.%203%20-%20Fluxo%20de%20Telas.pdf)

## Como rodar localmente

### Backend (porta 8000)

```bash
cd backend
python -m venv env
# Windows: env\Scripts\activate   |   Mac/Linux: source env/bin/activate
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver
```

### Frontend (porta 5173)

Em outro terminal:

```bash
cd frontend/entrevista-frontend
npm install
npm run dev
```

Acesse http://localhost:5173. O frontend chama o backend em `http://localhost:8000`. Para mudar esse endereço, defina a variável `VITE_API_URL`.

## API

| Método | Rota | Autenticação | Descrição |
|---|---|---|---|
| POST | `/cadastro/` | não | Cria conta (`nome`, `email`, `senha`) e retorna `token` + `user` |
| POST | `/login/` | não | Login (`email`, `senha`) e retorna `token` + `user` |
| POST | `/logout/` | sim | Invalida o token |
| GET | `/me/` | sim | Dados do usuário logado |

Rotas autenticadas exigem o header `Authorization: Token <token>`.
