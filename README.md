# Abreu Piercer · Catálogo de joias

> **A pergunta central:** como um piercer que vende joias no atendimento local pode mostrar todo o catálogo pelo celular e receber pedidos organizados, sem precisar de uma loja virtual com pagamento?

Catálogo on-line de joias de piercing para a marca **Abreu Piercer**. A cliente escolhe as peças e os tamanhos, monta o carrinho e **finaliza o orçamento pelo WhatsApp**, com a mensagem já pronta. O site foi pensado para o celular e tem visual **Liquid Glass** (vidro fosco e acetinado), seguindo a identidade da marca.

**Site no ar:** https://abreu-piercer.onrender.com

---

## Telas

| Início | Tipos de joia | Catálogo |
|:---:|:---:|:---:|
| <img src="prints/1-inicio.jpg" width="220" alt="Tela inicial do catálogo"> | <img src="prints/2-categorias.jpg" width="220" alt="Cartões das categorias de joias"> | <img src="prints/3-catalogo.jpg" width="220" alt="Página de argolas com fotos e tamanhos"> |

---

## Funcionalidades

- **Catálogo por categorias** (argolas, correntes, joias retas, umbigo, transversais...) e uma seção **PVD Gold**, montada automaticamente para as joias douradas
- **Escolha de tamanho** em cada joia e **carrinho** que fica guardado no celular
- **Finalizar pelo WhatsApp**: a mensagem já sai com as joias, os tamanhos e o cupom em negrito
- **Guia de tamanhos** com explicação simples e pop-up de ajuda na primeira joia adicionada
- **Pesquisa de satisfação em estrelas** que gera um **cupom de 5%**
- **Carrossel "Inspire-se"** com trabalhos realizados
- **Catálogo atualizado por uma planilha Google**: dá para lançar joias novas sem mexer no código
- **Navegação inferior fixa**, transições suaves e imagens leves para carregar rápido

## Como um pedido funciona

```mermaid
flowchart TD
    A[Cliente navega pelas categorias] --> B[Escolhe a joia e o tamanho]
    B --> C[Joia vai para o carrinho, guardado no celular]
    C --> D{Primeira joia?}
    D -->|Sim| E[Pop-up com o guia de tamanhos]
    D -->|Não| F[Aviso suave, sem travar a navegação]
    E --> G[Finalizar orçamento]
    F --> G
    G --> H[Oferta de cupom: responder a pesquisa em estrelas]
    H --> I[WhatsApp abre com a lista de joias, tamanhos e cupom em negrito]
```

## Decisões e por quê

| Decisão | Por quê |
|---|---|
| Sem preços e sem pagamento no site | O atendimento é local e o valor depende da peça e da perfuração. O site organiza o pedido e a conversa fecha a venda |
| Pedido finalizado pelo WhatsApp | É onde os clientes já conversam com a marca. A mensagem chega pronta, sem o cliente precisar digitar nada |
| Catálogo vindo de uma planilha Google | O dono do negócio lança joias novas sozinho, sem mexer em código |
| Pop-up do guia de tamanhos só na primeira joia | Ajuda quem tem dúvida sem irritar quem já sabe o tamanho |
| Cupom de 5% em troca da pesquisa | Dá um motivo para o cliente avaliar o atendimento, e cada cupom só pode ser usado uma vez |

## Um bug real e como resolvi

Depois de publicado, o botão **"Guia de tamanhos"** da página inicial apareceu torto no celular: o texto grudado no topo e o botão um pouco mais baixo que o "Ver as joias".

**Como investiguei:** abri o site em tamanho de celular e comparei os dois botões com as ferramentas do navegador. O "Ver as joias" estava com `display: flex` (que centraliza o texto), mas o "Guia de tamanhos" estava com `display: block`.

**A causa:** uma regra de CSS criada para os botões de outra parte do site era genérica demais:

```css
.botao-vazado[href] { display: block; margin-top: 10px; }
```

Ela valia para **todo** botão vazado que fosse um link, e o "Guia de tamanhos" também era. A regra "vazou" para onde não devia.

**A solução:** trocar a regra genérica por uma classe própria (`.botao-largo`), usada só onde ela era necessária. A lição foi escrever regras de CSS específicas, para que uma mudança num canto do site não quebre outro.

## Segurança

- Senhas e chaves apenas em **variáveis de ambiente** no servidor
- Área restrita com **senha, limite de tentativas, proteção CSRF e login com validade**
- **Política de segurança de conteúdo (CSP)** e outros cabeçalhos de proteção
- Dados de clientes e informações comerciais **nunca** vão para o repositório

## Tecnologias

| Parte | O que usei |
|---|---|
| Front-end | HTML5, CSS3 (Liquid Glass, responsivo, *mobile first*), JavaScript puro |
| Back-end | Python 3, Flask, Jinja2 |
| Dados | Google Planilhas (catálogo) + Google Apps Script |
| Integração | Link do WhatsApp com mensagem pronta |
| Hospedagem | Render (com Gunicorn) |
| Ferramentas | VS Code, Git, GitHub e GitHub Desktop |

---

## O que tem neste repositório

Este é um **repositório-vitrine**: ele mostra a parte visual do catálogo (o que roda no navegador).

```
templates/   páginas HTML (Jinja2): início, categorias, cartão da joia, guia de tamanhos e carrinho
static/      style.css (todo o visual) e app.js (carrinho, pop-ups, pesquisa, cupom e WhatsApp)
prints/      capturas de tela do site
```

O **back-end** (servidor em Flask, planilha, cupons e área restrita) é **privado**, por segurança. As fotos das joias também ficam de fora. Por isso o projeto não roda só com estes arquivos. Para ver funcionando, acesse o [site no ar](https://abreu-piercer.onrender.com).

## O que aprendi

- Criar um visual "vidro fosco" (Liquid Glass) que fica bonito e continua leve no celular
- Organizar o CSS para que uma regra não "vaze" e estrague outra parte do site
- Usar uma planilha como "painel" simples para o dono do negócio atualizar o catálogo
- Montar um carrinho que funciona só no navegador e vira uma mensagem de WhatsApp
- Proteger uma área restrita (senha, CSRF, limite de tentativas)

---

Desenvolvido por **Airan Abreu Tavares** · [@abreuairan](https://github.com/abreuairan)

© Todos os direitos reservados: o código pode ser visto para avaliação, mas não pode ser copiado ou reutilizado sem permissão.
