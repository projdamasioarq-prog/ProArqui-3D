# Karen | Assistente ProArqui 3D

## Estado desta entrega
Esta branch adiciona a interface de conversa guiada, hotspot no lobby, coleta progressiva, resumo revisável, cópia/arquivo TXT e atalho de WhatsApp condicionado ao número configurado. O fluxo não calcula preço nem prazo enquanto não houver regras comerciais aprovadas. A interface é um protótipo conversacional guiado; **a integração com um modelo de IA generativa ainda precisa ser conectada no servidor**. Não apresente esta versão como atendimento de IA generativa já ativo.

## Executar localmente
1. Instale Node.js 20 ou superior.
2. Clone/baixe esta branch.
3. Execute `npm install`.
4. Copie `.env.example` para `.env`, gere um ADMIN_TOKEN forte e defina um diretório privado de uploads fora da pasta do site.
5. Execute `npm start` e abra http://localhost:3000.
6. Rode `npm test` para validar a configuração básica.

## Configuração comercial
Edite `config/assistant.json` no servidor ou use os endpoints administrativos protegidos:
- GET/PUT `/api/admin/config` com cabeçalho `Authorization: Bearer SEU_ADMIN_TOKEN`.
- Cadastre serviços em `services`.
- Cadastre regras em `pricingRules` somente depois de aprovar fórmula, unidade, mínimo/máximo e critérios de complexidade.
- Cadastre prazos em `deadlines`, condições em `conditions`, exclusões em `scopeExclusions`.
- Informe `whatsappNumber` com DDI e DDD, somente após confirmar o número oficial.
- Preencha dados da empresa em `companyDetails`.

Não há preço, prazo, desconto ou condição fictícia pré-configurada. A lista vazia significa que não existe cálculo comercial habilitado.

## Arquivos e privacidade
O servidor aceita até 8 arquivos por envio, PDF ou imagem (JPEG/PNG/WebP/HEIC), até o limite definido em `MAX_FILE_MB`. Os arquivos são armazenados fora da pasta pública e não são executados. A remoção administrativa usa DELETE `/api/admin/files/:id`. Configure backup, retenção, controle de acesso, HTTPS e rotina de exclusão antes de receber documentos reais.

A interface desta branch ainda mantém os anexos no navegador durante a sessão e não os envia automaticamente. A conexão do envio ao endpoint privado deve ser validada antes de produção. Não publique o diretório de uploads.

## Limitações e revisão antes de uso real
- A conversa atual é guiada por etapas, não por um modelo de IA generativa. Conectar um provedor de IA requer endpoint servidor, chave em variável de ambiente, política de retenção, filtros e testes.
- GitHub Pages não executa Node/Express. Para usar endpoints privados, hospede o servidor em infraestrutura própria e configure domínio/API com HTTPS e CORS restrito.
- Implementar consentimento LGPD completo, aviso de privacidade, canal para direitos do titular, retenção e exclusão automatizada.
- Profissional responsável deve revisar escopo, critérios de complexidade, cálculos, prazos, exclusões, condições e linguagem técnica.
- Não usar a conversa para parecer definitivo sobre estrutura, segurança, normas, licenças ou viabilidade.
- Nenhum deploy ou publicação foi realizado por esta branch.
