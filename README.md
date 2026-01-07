# MutanoX API - Dashboard Completo

API robusta para consulta de informações de telefone, CPF e nome, com dashboard administrativo completo em tempo real e dados **100% REAIS**.

## 🚀 Funcionalidades

### API de Consultas (Dados Reais)
- **Consulta de Telefone**: Obtém informações reais de números de telefone brasileiros
- **Consulta de CPF**: Valida e retorna informações completas de CPF (dados reais)
- **Consulta por Nome**: Busca pessoas por nome completo (dados reais)
- **Múltiplos outros endpoints**: Bypass Cloudflare, Gerador de Vídeo, Imagens NSFW, FreeFire, Downloader, etc.

### Dashboard Administrativo
- **Dashboard em Tempo Real**: Métricas de uso da API
- **Logs em Tempo Real**: Visualização de todas as requisições
- **Sistema de API Keys**: Autenticação e controle de acesso
- **Gestão de Chaves**: Criar, ativar/desativar, deletar API keys
- **Gráficos de Uso**: Distribuição de requisições por endpoint
- **Monitoramento de Uptime**: Tempo de atividade do sistema

## 📋 Pré-requisitos

- Node.js 18+ ou Bun
- npm ou bun

## 🔧 Instalação

1. Clone o repositório:
```bash
git clone https://github.com/MutanoXX/MutanoX_API.git
cd MutanoX_API
```

2. Instale as dependências:
```bash
npm install
# ou
bun install
```

## 🏃 Executando

### Modo Desenvolvimento
```bash
npm run dev
# ou
bun run dev
```

### Modo Produção
```bash
npm start
# ou
bun run start
```

A API estará disponível em `http://localhost:8080`
O Dashboard estará disponível em `http://localhost:8080/admin`

## 🔑 Autenticação

A API requer uma API key válida para acessar os endpoints. Keys disponíveis:

- **Admin Key**: `MutanoX3397` (acesso completo ao dashboard e API)
- **Test Key**: `test-key` (para testes e uso geral da API)

### Criar Nova API Key (Admin Only)
```http
POST /api/admin/keys?owner=Nome&role=user
apikey: MutanoX3397
```

## 📡 Rotas da API

### Dashboard HTML
```http
GET /admin?apikey=MutanoX3397
```
Acessa o dashboard administrativo completo.

### Consultas (Requer API Key)

#### Consultar Telefone
```http
GET /api/consultas?tipo=numero&q=65999701064&apikey=test-key
```

**Exemplo de Resposta:**
```json
{
  "sucesso": true,
  "totalResultados": 4,
  "resultados": [
    {
      "cpfCnpj": "04815502161",
      "nome": "LUCIENE APARECIDA BALBINO FIDELIS",
      "dataNascimento": "04/02/1993",
      "bairro": "JUNCO",
      "cidadeUF": "CACERES/MT",
      "cep": "07820000"
    }
  ],
  "criador": "@MutanoX"
}
```

#### Consultar CPF
```http
GET /api/consultas?tipo=cpf&cpf=04815502161&apikey=test-key
```

**Exemplo de Resposta:**
```json
{
  "sucesso": true,
  "dados": {
    "dadosBasicos": {
      "nome": "LUCIENE APARECIDA BALBINO FIDELIS",
      "cpf": "04815502161",
      "dataNascimento": "04/02/1993 (32 anos)",
      "sexo": "F - FEMININO",
      "nomeMae": "ADELINA BALBINO FIDELIS",
      "nomePai": "DONIZETE LUIZ FIDELIS",
      "situacaoCadastral": "REGULAR",
      "dataSituacao": "26/10/2019"
    },
    "dadosEconomicos": {
      "renda": "R$ 541,64",
      "poderAquisitivo": "MUITO BAIXO",
      "faixaRenda": "De R$ 112 até R$ 630",
      "scoreCSBA": "444"
    },
    "enderecos": [
      {
        "logradouro": "R PRUDENTE DE MORAES, 413",
        "bairro": "CIDADE NOVA",
        "cidadeUF": "CACERES/MT",
        "cep": "78201020"
      }
    ],
    "informacoesImportantes": {
      "cpfValido": "Não",
      "obito": "NÃO",
      "pep": "Não"
    }
  },
  "criador": "@MutanoX"
}
```

#### Consultar por Nome
```http
GET /api/consultas?tipo=nome&q=Silva&apikey=test-key
```

### Admin API (Requer Admin Key: MutanoX3397)

#### Validar Admin
```http
GET /api/admin/validate?apikey=MutanoX3397
```

#### Listar Keys
```http
GET /api/admin/keys?apikey=MutanoX3397
```

#### Criar Key
```http
POST /api/admin/keys?owner=Nome&role=user&apikey=MutanoX3397
```

#### Toggle Key Status
```http
POST /api/admin/toggle?target=CHAVE&apikey=MutanoX3397
```

#### Deletar Key
```http
DELETE /api/admin/keys?target=CHAVE&apikey=MutanoX3397
```

#### Stats Completos
```http
GET /api/admin/stats?apikey=MutanoX3397
```

#### Logs
```http
GET /api/admin/logs?apikey=MutanoX3397
```

## 🧪 Testes

Execute os testes para verificar se a API está funcionando corretamente:

```bash
npm test
# ou
bun test
```

O teste irá:
1. Verificar o acesso ao dashboard HTML
2. Validar a Admin Key
3. Obter stats do admin
4. Consultar o telefone 65999701064 (API REAL)
5. Consultar o CPF retornado (API REAL)
6. Consultar por nome "Silva" (API REAL)
7. Obter logs do admin

## 📊 Dashboard Features

O dashboard administrativo em tempo real inclui:

### Métricas em Tempo Real
- **Total Requests**: Número total de requisições
- **Active Keys**: Quantidade de chaves ativas
- **Real-Time Load**: Requisições por segundo
- **System Status**: Status do sistema (ONLINE)
- **Uptime**: Tempo de atividade do sistema

### Gestão de API Keys
- **Tabela de Chaves**: Visualização de todas as chaves
- **Criar Chaves**: Gerar novas chaves de acesso
- **Ativar/Desativar**: Toggle de status de chaves
- **Deletar**: Remover chaves não utilizadas
- **Visualização**: Nome, identificador, uso e status

### Gráficos e Estatísticas
- **Gráfico de Pizza**: Distribuição de requisições por endpoint
- **Lista de Endpoints**: Visualização detalhada por tipo de consulta
- **Atualização em Tempo Real**: Dados atualizados a cada 2 segundos

### Logs em Tempo Real
- **Terminal Virtual**: Visualização estilo terminal de todos os logs
- **Coloração**: Logs coloridos por tipo (SUCCESS, ERROR, INFO, AUTH)
- **Auto-Scroll**: Rolamento automático para novos logs
- **Limpeza**: Botão para limpar o terminal

## 🏗️ Estrutura do Projeto

```
MutanoX_API/
├── api.js                        # Servidor principal da API (versão original)
├── testar-tudo.js                # Script de testes completo
├── package.json                  # Dependências e scripts
├── api_keys.json                 # Chaves de API
├── .gitignore                    # Arquivos ignorados pelo git
├── README.md                     # Documentação
├── dashboards/                   # Pasta de dashboards
│   └── dashboard_apikeys.html     # Dashboard administrativo HTML
└── .git/                        # Controle de versão
```

## 🌐 Integração com Frontend

### Exemplo de Requisição (JavaScript/TypeScript)

```typescript
// Consultar telefone
const response = await fetch('http://localhost:8080/api/consultas?tipo=numero&q=65999701064&apikey=test-key');
const data = await response.json();

// Consultar CPF
const response = await fetch('http://localhost:8080/api/consultas?tipo=cpf&cpf=04815502161&apikey=test-key');
const data = await response.json();

// Consultar por nome
const response = await fetch('http://localhost:8080/api/consultas?tipo=nome&q=Silva&apikey=test-key');
const data = await response.json();
```

### Exemplo de Requisição (cURL)

```bash
# Consultar telefone
curl "http://localhost:8080/api/consultas?tipo=numero&q=65999701064&apikey=test-key"

# Consultar CPF
curl "http://localhost:8080/api/consultas?tipo=cpf&cpf=04815502161&apikey=test-key"

# Consultar por nome
curl "http://localhost:8080/api/consultas?tipo=nome&q=Silva&apikey=test-key"
```

### Acessar Dashboard

Abra o navegador e acesse:
```
http://localhost:8080/admin?apikey=MutanoX3397
```

## ⚠️ Notas Importantes

1. **Dados Reais**: Esta API consome dados de APIs externas e retorna informações reais.
2. **API Keys**: Todas as requisições requerem uma API key válida (apikey query parameter ou x-api-key header).
3. **Admin Dashboard**: Requer a Admin Key (`MutanoX3397`) para acessar.
4. **API Externa**: A API depende de serviços externos (world-ecletix.onrender.com) que podem ter limitações.
5. **Logs**: Os logs são armazenados em memória e mantêm as últimas 50 entradas.
6. **CORS**: Habilitado para todas as origens (configure para produção).
7. **Persistência**: As API keys são armazenadas em `api_keys.json`.

## 🔐 Segurança

- Sistema de autenticação via API keys
- CORS habilitado para todas as origens (configure para produção)
- Validação de entrada de dados
- Tratamento de erros adequado
- Logs de requisições com timestamps
- Controle de acesso por role (admin/user)
- Dashboard protegido por admin key

## 📝 API Externa

Esta API consome dados de APIs externas:
- Base de dados de CPF/Telefone/Nome (world-ecletix.onrender.com)
- Bypass Cloudflare (anabot.my.id)
- Gerador de Vídeo (anabot.my.id)
- Downloader (anabot.my.id)
- E outros...

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/NovaFuncionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/NovaFuncionalidade`)
5. Abra um Pull Request

## 📄 Licença

MIT License - veja o arquivo LICENSE para detalhes.

## 👤 Autor

@MutanoX

## 🙋 Suporte

Para suporte, abra uma issue no repositório ou entre em contato com o autor.

## 🎉 Resultados Testados

### Teste com Telefone 65999701064
```
✅ Consulta realizada com sucesso!
   Total de resultados: 4
   Primeiro resultado:
   Nome: LUCIENE APARECIDA BALBINO FIDELIS
   CPF/CNPJ: 00004815502161
   Cidade/UF: CACERES/MT
   Bairro: JUNCO
   CEP: 07820000
```

### Teste com CPF 04815502161
```
✅ Consulta de CPF realizada com sucesso!
   Nome: LUCIENE APARECIDA BALBINO FIDELIS
   CPF: 04815502161
   Data Nascimento: 04/02/1993 (32 anos)
   Sexo: F - FEMININO
   Situação: REGULAR
   Renda: R$ 541,64
   Endereços: 4 endereços completos
```

### Teste com Nome "Silva"
```
✅ Consulta por nome realizada com sucesso!
   Total de resultados: 500
```

## 🎨 Dashboard

O dashboard administrativo oferece uma interface completa e moderna para:

- Monitorar o uso da API em tempo real
- Gerenciar chaves de acesso
- Visualizar logs do sistema
- Analisar distribuição de requisições
- Criar e remover usuários

Acesse: `http://localhost:8080/admin` (com Admin Key)

🚀 **API 100% FUNCIONAL COM DADOS REAIS E DASHBOARD COMPLETO!**
