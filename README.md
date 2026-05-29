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

**Pré-requisitos:** Node.js instalado (v18+ recomendado).

1. Clone o repositório e acesse a pasta do projeto.
2. Instale as dependências:
   ```bash
   npm install
Inicie o servidor em ambiente de desenvolvimento:

Bash
npm run dev
O servidor estará rodando em http://localhost:3000.

Rodando a Suíte de Testes
O projeto conta com uma suíte de testes automatizados construída com Vitest, seguindo o padrão AAA (Arrange, Act, Assert). Os testes cobrem caminhos de sucesso, conflitos parciais/englobamento, validações de payload e formatação de fuso horário.

Para executar os testes:

Bash
npm test
Exemplos de Chamadas (cURL)
1. Criar um Agendamento (POST)
Cria um novo agendamento, respeitando o horário de Brasília (offset -03:00).

Bash
curl -X POST http://localhost:3000/api/agendamentos \
  -H "Content-Type: application/json" \
  -d '{
    "corretorId": "c-101",
    "imovelId": "im-553",
    "inicio": "2026-06-10T14:00:00-03:00",
    "duracaoMinutos": 60
  }'
Retorno de Sucesso Esperado (HTTP 201):

JSON
{
  "agendamentoId": "ag-001",
  "corretorId": "c-101",
  "imovelId": "im-553",
  "inicio": "2026-06-10T14:00:00-03:00",
  "fim": "2026-06-10T15:00:00-03:00",
  "status": "confirmado"
}
Retorno de Conflito Esperado (HTTP 409): Caso o corretor já possua uma visita no horário, a API retornará sugestões determinísticas no mesmo dia:

JSON
{
  "status": "conflito",
  "motivo": "Corretor indisponível no horário solicitado",
  "sugestoes": [
    "2026-06-10T08:00:00-03:00",
    "2026-06-10T08:30:00-03:00",
    "2026-06-10T09:00:00-03:00"
  ]
}
2. Listar Agendamentos (GET)
Busca a agenda completa de um corretor em uma data específica.

Bash
curl -X GET "http://localhost:3000/api/agendamentos?corretorId=c-101&data=2026-06-10" \
  -H "Accept: application/json"