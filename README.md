# Controle Cartão Anauê

Um aplicativo PWA (Progressive Web App) completo para controle de cartão de crédito baseado em planilha, com suporte offline, funcionalidade de parcelas automáticas e filtros avançados.

## 🚀 Características

- ✅ **PWA Completo** - Funciona offline com cache automático
- ✅ **Sem Backend** - Tudo roda localmente no navegador
- ✅ **IndexedDB** - Persistência local de dados
- ✅ **Parcelas Automáticas** - Gera múltiplas linhas para compras parceladas
- ✅ **Dashboard Inteligente** - Totais por mês, cartão e pessoa
- ✅ **Filtros Avançados** - Ano, mês, cartão, classificação, responsável
- ✅ **Mobile-First** - Design responsivo otimizado para iPhone
- ✅ **Sem Login** - Uso pessoal direto

## 📋 Estrutura de Dados

Cada lançamento contém as seguintes colunas:

| Campo | Descrição |
|-------|-----------|
| ANO | Ano do lançamento |
| MÊS | Mês do lançamento |
| CARTÃO | Nome do cartão utilizado |
| VENC | Dia de vencimento do cartão |
| DATA | Data da compra original |
| DESCRIÇÃO | Descrição da compra |
| CLASSIFICAÇÃO | Categoria (Alimentação, Combustível, etc) |
| VALOR TOTAL | Valor total da compra |
| PARC. ATUAL | Número da parcela atual |
| QTD PARCELA | Quantidade total de parcelas |
| VALOR PARCELA | Valor de cada parcela |
| QUEM | Responsável pela compra |

## 🛠️ Instalação Local

### Pré-requisitos
- Python 3.6+ (ou qualquer servidor HTTP)
- Navegador moderno (Chrome, Safari, Firefox, Edge)

### Passos

1. **Clone ou baixe os arquivos:**
```bash
git clone <seu-repositório>
cd controle-cartao-anauê
```

2. **Inicie um servidor HTTP local:**

**Opção 1: Python 3**
```bash
python3 -m http.server 8000
```

**Opção 2: Node.js (http-server)**
```bash
npx http-server -p 8000
```

**Opção 3: Live Server (VS Code)**
- Instale a extensão "Live Server"
- Clique com botão direito no `index.html` e selecione "Open with Live Server"

3. **Acesse no navegador:**
```
http://localhost:8000
```

## 📱 Instalação no iPhone

### Via Safari

1. Abra o Safari no iPhone
2. Acesse a URL do aplicativo (local ou publicado)
3. Toque no botão de compartilhamento (quadrado com seta)
4. Selecione **"Adicionar à Tela de Início"**
5. Escolha um nome para o app (ex: "Controle Cartão")
6. Toque em **"Adicionar"**

### Resultado
- O app aparecerá na tela inicial como um ícone
- Funciona como app nativo (sem barra de endereço)
- Funciona offline após primeira visita
- Todos os dados são salvos localmente no dispositivo

## 🌐 Deploy no Vercel

### Opção 1: Deploy via Git (Recomendado)

1. **Faça push para GitHub:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/controle-cartao-anauê.git
git push -u origin main
```

2. **Acesse Vercel:**
   - Vá para https://vercel.com
   - Clique em "New Project"
   - Selecione seu repositório GitHub
   - Clique em "Deploy"

3. **Pronto!** Seu app estará disponível em `https://seu-projeto.vercel.app`

### Opção 2: Deploy Manual

1. **Instale Vercel CLI:**
```bash
npm install -g vercel
```

2. **Faça deploy:**
```bash
vercel
```

3. **Siga as instruções na tela**

## 🌐 Deploy no Netlify

1. **Acesse Netlify:**
   - Vá para https://netlify.com
   - Clique em "Add new site"
   - Selecione "Deploy manually"

2. **Arraste a pasta do projeto:**
   - Arraste todos os arquivos (index.html, styles.css, app.js, manifest.json, service-worker.js)
   - Ou faça upload via GitHub

3. **Pronto!** Seu app estará disponível em `https://seu-projeto.netlify.app`

## 🌐 Deploy no GitHub Pages

1. **Crie um repositório:**
```bash
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/controle-cartao-anauê.git
git push -u origin main
```

2. **Ative GitHub Pages:**
   - Vá para Settings do repositório
   - Selecione "Pages"
   - Em "Source", selecione "main branch"
   - Clique em "Save"

3. **Acesse:**
   - `https://seu-usuario.github.io/controle-cartao-anauê`

## 📖 Como Usar

### 1. Cadastrar Cartão
- Vá para aba **"Cartões"**
- Clique em **"➕"**
- Preencha:
  - Nome do cartão (ex: Nubank)
  - Dia de vencimento (ex: 15)
- Clique em **"Salvar"**

### 2. Lançar Compra
- Vá para aba **"Compra"**
- Preencha:
  - Cartão
  - Data da compra
  - Descrição
  - Classificação
  - Valor total
  - Número de parcelas (1 = à vista)
  - Responsável
- Clique em **"Lançar Compra"**

**Resultado:** Se parcelada, o sistema cria automaticamente múltiplas linhas (uma por mês)

### 3. Consultar Registros
- Vá para aba **"Consulta"**
- Use os filtros:
  - Ano
  - Mês
  - Cartão
  - Classificação
  - Responsável
- Clique em um registro para **editar** ou **deletar**

### 4. Dashboard
- Vá para aba **"Dashboard"**
- Veja:
  - Total do mês
  - Total por cartão
  - Total por pessoa
  - Totais históricos
  - Gráfico dos últimos 6 meses

## 🔐 Segurança e Privacidade

- ✅ **Sem servidor** - Dados nunca saem do seu dispositivo
- ✅ **Sem login** - Uso pessoal direto
- ✅ **Sem rastreamento** - Sem cookies ou analytics
- ✅ **Dados locais** - Tudo armazenado em IndexedDB
- ✅ **Offline** - Funciona sem conexão

## 💾 Backup de Dados

Os dados são salvos automaticamente no navegador. Para fazer backup:

1. Exporte os dados (futura funcionalidade)
2. Guarde o arquivo JSON em local seguro
3. Para restaurar, importe o arquivo

## 🐛 Troubleshooting

### App não carrega no iPhone
- Certifique-se que o servidor está rodando
- Verifique se a URL está correta
- Tente em modo privado do Safari

### Dados desaparecem
- Não limpe o cache/cookies do navegador
- Se limpar, os dados serão perdidos
- Sempre faça backup antes de limpar dados

### Parcelas não aparecem
- Verifique se o número de parcelas é > 1
- Confirme que o cartão foi selecionado
- Verifique o console do navegador (F12) para erros

## 📱 Compatibilidade

| Navegador | Desktop | Mobile |
|-----------|---------|--------|
| Chrome | ✅ | ✅ |
| Firefox | ✅ | ✅ |
| Safari | ✅ | ✅ |
| Edge | ✅ | ✅ |

## 📄 Arquivos do Projeto

```
controle-cartao-anauê/
├── index.html           # Estrutura HTML
├── styles.css           # Estilos CSS
├── app.js               # Lógica JavaScript
├── manifest.json        # Configuração PWA
├── service-worker.js    # Cache offline
└── README.md            # Este arquivo
```

## 🚀 Tecnologias Utilizadas

- **HTML5** - Estrutura semântica
- **CSS3** - Design responsivo mobile-first
- **JavaScript ES6+** - Lógica e interatividade
- **IndexedDB** - Banco de dados local
- **Service Workers** - Funcionalidade offline
- **PWA** - Progressive Web App

## 📝 Licença

Este projeto é de código aberto e pode ser usado livremente.

## 💬 Suporte

Para dúvidas ou sugestões, abra uma issue no repositório.

---

**Desenvolvido com ❤️ para controle financeiro pessoal**
