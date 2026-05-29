## Arquitetura e Padrões

O projeto foi estruturado utilizando conceitos de **Clean Architecture** e princípios **SOLID**, garantindo baixo acoplamento e alta coesão:

* **Controllers:** Responsáveis por interceptar a requisição HTTP, validar a entrada (prevenindo payloads maliciosos) e retornar os DTOs no formato esperado.
* **Services:** Contêm o coração da regra de negócio, isolando a validação de horários e a verificação de conflitos parciais e totais.
* **Repositories:** Camada de persistência de dados isolada da regra de negócio.
* **Factories:** Utilizadas para aplicar o padrão de **Injeção de Dependência (DI)**, instanciando e conectando o fluxo de dados.
* **DTOs:** Garantem o contrato da API, blindando a camada de domínio contra dados malformados.
* **Erros Customizados:** Classes herdadas de `Error` (`BusinessError` e `ConflictError`) para padronização de respostas HTTP e manutenção do *stack trace*.
* **Utils:** O isolamento da matemática de fuso horário em JavaScript puro foi escolhido deliberadamente. Com o uso de `Date.UTC`, garantimos que a janela de atendimento (08h às 19h no fuso de Brasília) funcione perfeitamente em qualquer ambiente ou container, eliminando a necessidade de bibliotecas externas (como `moment` ou `date-fns`).

## Persistência em Memória

A persistência de dados foi implementada utilizando a estrutura nativa **`Map`** do JavaScript (`Map<string, Schedule[]>`). 
A chave do mapa é o `corretorId` e o valor é um array de agendamentos daquele corretor. Essa escolha garante buscas de agenda com complexidade **O(1)**, proporcionando alta performance e consultas instantâneas, sem varreduras desnecessárias no histórico global.

## Como Executar o Projeto

### Pré-requisitos
- Node.js (v18+)
- npm ou yarn

### Instalação
```bash
# Instale as dependências
npm install
```

### Execução
```bash
# Modo de desenvolvimento
npm run dev
```
O servidor iniciará por padrão na porta **3000**.

## Suíte de Testes

A API possui **100% de cobertura** das regras de negócio, utilizando **Vitest** e seguindo o padrão **AAA (Arrange, Act, Assert)**.

```bash
# Rodar todos os testes
npm test
```

### O que é testado:
- Criação de agendamentos válidos.
- Bloqueio de agendamentos fora do horário comercial (08h - 19h).
- Detecção de conflitos de horários e englobamento.
- Geração inteligente de sugestões de horários disponíveis.

## Exemplos de Chamadas (cURL)

### 1. Criar um Agendamento (Sucesso)
```bash
curl -X POST http://localhost:3000/api/agendamentos \
     -H "Content-Type: application/json" \
     -d '{
      "corretorId": "c-101",
       "imovelId": "im-553",
       "inicio": "2026-05-30T10:00:00-03:00",
       "duracaoMinutos": 60
     }'
```

**Resposta (201 Created):**
```json
{
  "agendamentoId": "ag-001",
  "corretorId": "c-101",
  "imovelId": "im-553",
  "inicio": "2026-05-30T10:00:00-03:00",
  "fim": "2026-05-30T11:00:00-03:00",
  "status": "confirmado"
}
```

### 2. Conflito de Horário (Erro 409)
```bash
curl -X POST http://localhost:3000/api/agendamentos \
     -H "Content-Type: application/json" \
     -d '{
       "corretorId": "c-101",
       "imovelId": "im-456",
       "inicio": "2026-05-30T10:30:00-03:00",
       "duracaoMinutos": 30
     }'
```

**Resposta (409 Conflict):**
```json
{
  "status": "conflito",
  "motivo": "Corretor indisponível no horário solicitado",
  "sugestoes": [
    "2026-05-30T08:00:00-03:00",
    "2026-05-30T08:30:00-03:00",
    "2026-05-30T09:00:00-03:00"
  ]
}
```

### 3. Validação de Horário de Funcionamento
Tenta criar um agendamento fora da janela permitida (08:00 às 19:00 no fuso de Brasília).

```bash
curl -X POST http://localhost:3000/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{
    "corretorId": "c-101",
    "imovelId": "im-553",
    "inicio": "2026-05-30T07:30:00-03:00",
    "duracaoMinutos": 60
  }'
```

**Resposta (400 Bad Request):**
```json
{
  "error": "O agendamento deve ocorrer entre 08:00 e 19:00."
}
```

### 4. Validação de Duração (Erro 400)
Tenta criar um agendamento com duração fracionada (não múltipla de 30) ou fora do limite de 30 a 180 minutos.

```bash
curl -X POST http://localhost:3000/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{
    "corretorId": "c-101",
    "imovelId": "im-553",
    "inicio": "2026-05-30T10:00:00-03:00",
    "duracaoMinutos": 45
  }'
```

**Resposta (400 Bad Request):**

```json
{
  "error": "Duração deve ser múltiplo de 30, entre 30 e 180 minutos."
}
```

### 5. Listar Agenda do Corretor
```bash
curl -G http://localhost:3000/api/agendamentos \
     --data-urlencode "corretorId=corretor-01" \
     --data-urlencode "data=2026-05-30"
```

**Resposta (200 OK):**

````JSON
[
  {
    "agendamentoId": "ag-001",
    "corretorId": "c-101",
    "imovelId": "im-553",
    "inicio": "2026-05-30T10:00:00-03:00",
    "fim": "2026-05-30T11:00:00-03:00",
    "status": "confirmado"
  }
]
````

---
