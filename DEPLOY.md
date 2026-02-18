# Guia de Deploy - Controle Cartão Anauê

Este documento contém instruções passo a passo para publicar o aplicativo em diferentes plataformas.

## 📱 Instalação no iPhone (Local)

### Via Safari - Método Recomendado

1. **Inicie um servidor local:**
```bash
python3 -m http.server 8000
```

2. **No iPhone, abra Safari e acesse:**
```
http://seu-ip-local:8000
```
(Substitua `seu-ip-local` pelo IP da sua máquina na rede)

3. **Toque no botão de compartilhamento** (quadrado com seta)

4. **Selecione "Adicionar à Tela de Início"**

5. **Escolha um nome** (ex: "Controle Cartão")

6. **Toque em "Adicionar"**

7. **Pronto!** O app aparecerá na tela inicial

### Características no iPhone
- ✅ Funciona como app nativo (sem barra de endereço)
- ✅ Ícone na tela inicial
- ✅ Funciona offline após primeira visita
- ✅ Dados salvos localmente no dispositivo

---

## 🚀 Deploy no Vercel (Recomendado)

### Pré-requisitos
- Conta no GitHub
- Conta no Vercel (gratuita)

### Passo 1: Prepare o Repositório GitHub

```bash
# Navegue até a pasta do projeto
cd controle-cartao-anauê

# Inicie git
git init

# Adicione todos os arquivos
git add .

# Faça commit
git commit -m "Initial commit: Controle Cartão Anauê"

# Renomeie branch para main
git branch -M main

# Adicione remote (substitua seu-usuario e seu-repo)
git remote add origin https://github.com/seu-usuario/controle-cartao-anauê.git

# Faça push
git push -u origin main
```

### Passo 2: Deploy no Vercel

1. **Acesse https://vercel.com**

2. **Clique em "New Project"**

3. **Selecione seu repositório GitHub**

4. **Clique em "Deploy"**

5. **Aguarde a conclusão**

6. **Seu app estará em:** `https://seu-projeto.vercel.app`

### Passo 3: Instale no iPhone

1. **Abra Safari no iPhone**

2. **Acesse:** `https://seu-projeto.vercel.app`

3. **Toque no botão de compartilhamento**

4. **Selecione "Adicionar à Tela de Início"**

5. **Pronto!**

---

## 🌐 Deploy no Netlify

### Pré-requisitos
- Conta no GitHub
- Conta no Netlify (gratuita)

### Passo 1: Push para GitHub
(Mesmo que Vercel - veja acima)

### Passo 2: Deploy no Netlify

1. **Acesse https://netlify.com**

2. **Clique em "Add new site"**

3. **Selecione "Import an existing project"**

4. **Escolha GitHub**

5. **Selecione seu repositório**

6. **Clique em "Deploy site"**

7. **Seu app estará em:** `https://seu-projeto.netlify.app`

### Passo 3: Instale no iPhone
(Mesmo que Vercel - veja acima)

---

## 📄 Deploy no GitHub Pages

### Passo 1: Prepare o Repositório

```bash
cd controle-cartao-anauê

git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/seu-usuario/controle-cartao-anauê.git
git push -u origin main
```

### Passo 2: Ative GitHub Pages

1. **Vá para Settings do repositório**

2. **Selecione "Pages" na barra lateral**

3. **Em "Source", selecione "Deploy from a branch"**

4. **Selecione "main" branch**

5. **Clique em "Save"**

6. **Aguarde alguns minutos**

7. **Seu app estará em:** `https://seu-usuario.github.io/controle-cartao-anauê`

### Passo 3: Instale no iPhone
(Mesmo que Vercel - veja acima)

---

## 🏠 Deploy Local (Desenvolvimento)

### Python 3
```bash
cd controle-cartao-anauê
python3 -m http.server 8000
# Acesse: http://localhost:8000
```

### Node.js
```bash
cd controle-cartao-anauê
npx http-server -p 8000
# Acesse: http://localhost:8000
```

### VS Code (Live Server)
1. Instale a extensão "Live Server"
2. Clique com botão direito em `index.html`
3. Selecione "Open with Live Server"

---

## 🔒 Segurança

### Headers de Segurança (Vercel)
O arquivo `vercel.json` configura automaticamente:
- ✅ Cache Control
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection

### Headers de Segurança (Netlify)
O arquivo `netlify.toml` configura automaticamente:
- ✅ Cache Control
- ✅ X-Content-Type-Options
- ✅ X-Frame-Options
- ✅ X-XSS-Protection

---

## 📊 Comparação de Plataformas

| Plataforma | Custo | Facilidade | Performance | Recomendação |
|-----------|-------|-----------|-------------|--------------|
| Vercel | Gratuito | ⭐⭐⭐⭐⭐ | Excelente | ✅ Melhor |
| Netlify | Gratuito | ⭐⭐⭐⭐⭐ | Excelente | ✅ Ótimo |
| GitHub Pages | Gratuito | ⭐⭐⭐⭐ | Bom | ✅ Bom |
| Local | - | ⭐⭐⭐⭐⭐ | Rápido | ✅ Desenvolvimento |

---

## 🆘 Troubleshooting

### App não carrega
- Verifique se o servidor está rodando
- Confirme a URL está correta
- Tente em modo privado do navegador

### Dados não sincronizam
- Dados são locais, não sincronizam entre dispositivos
- Faça backup exportando os dados

### Erro 404 em subpáginas
- Isso é normal para PWAs
- Vercel e Netlify redirecionam automaticamente para index.html
- GitHub Pages pode precisar de configuração adicional

### Offline não funciona
- Aguarde o service worker registrar (primeira visita)
- Verifique o console (F12) para erros
- Tente em modo privado

---

## 📞 Suporte

Para dúvidas, abra uma issue no repositório GitHub.

---

**Desenvolvido com ❤️**
