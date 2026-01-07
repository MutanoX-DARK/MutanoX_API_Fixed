# Como Acessar e Usar o Dashboard MutanoX API

## 🌐 Acessando o Dashboard

O dashboard frontend está disponível em:
```
http://localhost:3000
```

## 🔄 Arquitetura

- **Frontend (Next.js)**: Porta 3000
- **Backend (MutanoX API)**: Porta 3001
- **Gateway (Caddy)**: Porta 81

As requisições do frontend para a API passam pelo gateway Caddy usando o parâmetro `XTransformPort=3001`.

## ✅ Status dos Serviços

### Verificar se os serviços estão rodando:
```bash
# API MutanoX (Porta 3001)
curl "http://localhost:3001/mutanox/status"

# Expected response:
# {"sucesso":true,"status":"online","versao":"1.0.0",...}
```

## 🧪 Testes Realizados com Sucesso

### 1. Consulta de Telefone
**Número**: 65999701064

```bash
curl "http://localhost:3001/mutanox/telefone/65999701064"
```

**Resultado**:
```json
{
  "sucesso": true,
  "dados": {
    "telefone": "65999701064",
    "formato": "(65) 99970-1064",
    "ddd": "65",
    "estado": "MT",
    "tipo": "Celular",
    "operadora": "Oi",
    "cpf": "529.982.247-25",
    "dataConsulta": "2026-01-07T18:05:46.703Z"
  }
}
```

### 2. Consulta de CPF
**CPF Retornado**: 529.982.247-25

```bash
curl "http://localhost:3001/mutanox/cpf/52998224725"
```

**Resultado**:
```json
{
  "sucesso": true,
  "dados": {
    "cpf": "529.982.247-25",
    "nome": "Pedro Oliveira",
    "situacao": "Regular",
    "dataNascimento": "27/12/1956",
    "uf": "PE",
    "cidade": "Belo Horizonte",
    "genero": "Masculino",
    "dataConsulta": "2026-01-07T18:05:46.703Z"
  }
}
```

### 3. Métricas do Dashboard
```bash
curl "http://localhost:3001/mutanox/dashboard/metricas"
```

## 📊 Funcionalidades do Dashboard

### 1. Métricas em Tempo Real
- Total de consultas realizadas
- Consultas por tipo (Telefone/CPF)
- Contagem de erros
- Atualização automática a cada 5 segundos

### 2. Interface de Consulta
- **Telefone**: Digite o número (com ou sem formatação)
- **CPF**: Digite o CPF (com ou sem formatação)
- Validação em tempo real
- Feedback imediato de sucesso/erro

### 3. Histórico de Consultas
- Últimas 20 consultas de cada tipo
- Detalhes completos (data, hora, resultado)
- Opção de limpar histórico
- Visualização em formato de cards

### 4. Validação de Dados
- Telefone: 10 ou 11 dígitos
- CPF: 11 dígitos com verificação de dígito
- Mensagens de erro claras

## 🚀 Como Usar

### Através do Dashboard (Interface Gráfica)
1. Acesse http://localhost:3000
2. Use a aba "Consulta Telefone" para consultar números de telefone
3. Use a aba "Consulta CPF" para consultar CPFs
4. Visualize as métricas na parte superior
5. Acompanhe o histórico nas abas inferiores

### Via API (Programático)
```bash
# Consultar telefone
curl "http://localhost:3001/mutanox/telefone/NUMERO"
# Exemplo:
curl "http://localhost:3001/mutanox/telefone/65999701064"

# Consultar CPF
curl "http://localhost:3001/mutanox/cpf/CPF"
# Exemplo:
curl "http://localhost:3001/mutanox/cpf/52998224725"

# Métricas
curl "http://localhost:3001/mutanox/dashboard/metricas"

# Histórico de telefone
curl "http://localhost:3001/mutanox/dashboard/historico/telefone?limite=10"

# Histórico de CPF
curl "http://localhost:3001/mutanox/dashboard/historico/cpf?limite=10"

# Limpar histórico
curl -X DELETE "http://localhost:3001/mutanox/dashboard/historico/telefone"
curl -X DELETE "http://localhost:3001/mutanox/dashboard/historico/cpf"
```

## 📦 Repositório GitHub

- **Nome**: MutanoX_API
- **Status**: Privado
- **URL**: https://github.com/MutanoXX/MutanoX_API
- **Branch**: main
- **Commits**:
  1. `a77c12a` - Initial commit
  2. `018b185` - Atualiza rotas da API para /mutanox/*

## 🎨 Design do Dashboard

O dashboard foi desenvolvido com:
- **Framework**: Next.js 15 com TypeScript
- **UI Library**: shadcn/ui (New York style)
- **Styling**: Tailwind CSS
- **Ícones**: Lucide React
- **Tema**: Light/Dark mode support
- **Responsivo**: Mobile-first design

### Componentes Utilizados
- Card (métricas e consultas)
- Tabs (abas de navegação)
- Input (campos de entrada)
- Button (botões de ação)
- Badge (status e tags)
- ScrollArea (listas com scroll)
- Separator (divisores visuais)

## 📋 Resumo dos Arquivos do Projeto

### Backend API (`/home/z/MutanoX_API`)
- `server.js` - Servidor Express.js com rotas `/mutanox/*`
- `test.js` - Script de testes automatizados
- `package.json` - Dependências do projeto
- `.env.example` - Exemplo de variáveis de ambiente
- `.gitignore` - Arquivos ignorados pelo git
- `README.md` - Documentação completa
- `RESUMO.md` - Resumo do projeto
- `COMO_USAR.md` - Este arquivo

### Frontend Dashboard (`/home/z/my-project`)
- `src/app/page.tsx` - Dashboard React/Next.js
- `src/components/ui/*` - Componentes shadcn/ui

## 🔧 Troubleshooting

### Servidor da API não responde
```bash
# Verifique se está rodando
ps aux | grep "node --watch server.js"

# Reinicie se necessário
cd /home/z/MutanoX_API
bun run dev
```

### Dashboard não carrega
```bash
# Verifique logs
tail -50 /home/z/my-project/dev.log

# Reinicie Next.js (se necessário)
# (já está sendo executado automaticamente)
```

### Testes falhando
```bash
cd /home/z/MutanoX_API
bun test.js
```

## 📝 Notas Importantes

1. **Dados Simulados**: Os dados retornados são gerados aleatoriamente para fins de demonstração
2. **Armazenamento em Memória**: O histórico é perdido ao reiniciar o servidor
3. **Rotas da API**: Todas as rotas usam `/mutanox/` como prefixo
4. **Auto-refresh**: O dashboard atualiza automaticamente a cada 5 segundos
5. **Portas**: API na 3001, Dashboard na 3000

## 🎯 Próximos Passos

Para melhorar o sistema:
1. Implementar persistência de dados com banco de dados
2. Integrar com APIs reais de consulta
3. Adicionar autenticação e autorização
4. Implementar rate limiting
5. Adicionar logging avançado
6. Criar documentação OpenAPI/Swagger

---

**Tudo funcionando perfeitamente! 🎉**
