/* Abreu Piercer - comportamento do site (carrinho, pop-ups, pesquisa, WhatsApp).
   O carrinho fica guardado no próprio celular do cliente (localStorage), sem login. */
const Abreu = (() => {
  const K_CARRINHO = 'abreu_carrinho';   // lista de joias escolhidas
  const K_CUPOM = 'abreu_cupom';         // cupom ganho na pesquisa
  const K_USADO = 'abreu_cupom_usado';   // este aparelho já usou o cupom dele
  const K_GUIA = 'abreu_guia_visto';     // o pop-up do guia já apareceu uma vez

  // ---------- guardar e ler dados do aparelho ----------
  const lerJson = (chave, padrao) => {
    try { return JSON.parse(localStorage.getItem(chave)) ?? padrao; } catch { return padrao; }
  };
  const gravar = (chave, valor) => {
    try { localStorage.setItem(chave, JSON.stringify(valor)); } catch { /* modo privado */ }
  };
  const carrinho = () => lerJson(K_CARRINHO, []);
  const cupom = () => lerJson(K_CUPOM, null);

  // ---------- pequenos utilitários ----------
  const el = (html) => { const t = document.createElement('template'); t.innerHTML = html.trim(); return t.content.firstElementChild; };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const enviar = (url, dados) => fetch(url, {
    method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify(dados), keepalive: true,
  }).then((r) => r.json()).catch(() => ({ok: false}));

  function aviso(texto) {
    const t = el(`<div class="aviso-flutuante glass" role="status">${esc(texto)}</div>`);
    document.getElementById('avisos').appendChild(t);
    setTimeout(() => t.classList.add('sai'), 2200);
    setTimeout(() => t.remove(), 2700);
  }

  // ---------- contador do carrinho (topo e menu) ----------
  function atualizarContador() {
    const total = carrinho().reduce((s, i) => s + i.qtd, 0);
    document.querySelectorAll('[data-contador]').forEach((c) => {
      c.textContent = total; c.hidden = total === 0;
    });
  }

  // ---------- janelas (pop-ups) ----------
  function janela(conteudoHtml, aoFechar) {
    const fundo = el(`<div class="fundo-janela">
      <div class="janela glass" role="dialog" aria-modal="true">
        <button type="button" class="fechar" aria-label="Fechar">×</button>${conteudoHtml}
      </div></div>`);
    let fechada = false;
    const fechar = () => {                       // sai com um fade curto em vez de sumir de uma vez
      if (fechada) return; fechada = true;
      document.removeEventListener('keydown', esc_);
      fundo.classList.add('sai'); setTimeout(() => fundo.remove(), 200);
      aoFechar && aoFechar();
    };
    const esc_ = (e) => { if (e.key === 'Escape') fechar(); };
    fundo.querySelector('.fechar').addEventListener('click', fechar);
    fundo.addEventListener('click', (e) => { if (e.target === fundo) fechar(); });
    document.addEventListener('keydown', esc_);
    document.body.appendChild(fundo);
    fundo.querySelector('.fechar').focus();
    return {raiz: fundo, fechar};
  }

  // ---------- catálogo: escolher tamanho e adicionar ----------
  function iniciarCatalogo() {
    document.addEventListener('click', (e) => {
      const chip = e.target.closest('.chip');
      if (chip) {                                   // escolher tamanho (um por joia)
        chip.parentElement.querySelectorAll('.chip').forEach((c) => {
          c.classList.toggle('on', c === chip); c.setAttribute('aria-checked', c === chip);
        });
        return;
      }
      const botao = e.target.closest('[data-add]');
      if (!botao) return;
      const cartao = botao.closest('.cartao');
      const temTamanhos = cartao.querySelector('.chip');
      const escolhido = cartao.querySelector('.chip.on')?.dataset.tamanho || '';
      if (temTamanhos && !escolhido) {              // falta escolher o tamanho
        const grupo = cartao.querySelector('.tamanhos');
        grupo.classList.remove('treme'); void grupo.offsetWidth; grupo.classList.add('treme');
        aviso('Escolha um tamanho primeiro');
        return;
      }
      const textoOriginal = botao.textContent;     // resposta na hora, no próprio botão
      botao.textContent = 'Adicionada ✓'; botao.classList.add('feito');
      setTimeout(() => { botao.textContent = textoOriginal; botao.classList.remove('feito'); }, 1300);
      adicionar({
        codigo: cartao.dataset.codigo, nome: cartao.dataset.nome, categoria: cartao.dataset.categoria,
        tamanho: escolhido, desconto: Number(cartao.dataset.desconto) || 0, foto: cartao.dataset.foto || '',
      });
    });
  }

  function adicionar(joia) {
    const lista = carrinho();
    const existente = lista.find((i) => i.codigo === joia.codigo && i.tamanho === joia.tamanho);
    if (existente) existente.qtd += 1;
    else lista.push({codigo: joia.codigo, nome: joia.nome, tamanho: joia.tamanho, desconto: joia.desconto, foto: joia.foto, qtd: 1});
    gravar(K_CARRINHO, lista);
    atualizarContador();
    enviar('/api/evento', {tipo: 'add_carrinho', codigo: joia.codigo, nome: joia.nome, categoria: joia.categoria});

    // Só na PRIMEIRA joia: pop-up com o guia. Nas seguintes, só um aviso suave (não trava a navegação).
    let jaViu = false;
    try { jaViu = !!localStorage.getItem(K_GUIA); } catch (_) { jaViu = true; }
    if (jaViu) { aviso('Adicionada ao carrinho ✓'); return; }
    try { localStorage.setItem(K_GUIA, '1'); } catch (_) { /* sem armazenamento: segue */ }
    janela(`<h2>Adicionada ao carrinho ✓</h2>
      <p class="pergunta">Não sabe qual tamanho?<br><a href="/guia-de-tamanhos">Veja nosso guia</a></p>
      <a class="botao botao-vazado" href="/carrinho">Ver carrinho</a>`);
  }

  // ---------- página do carrinho ----------
  function iniciarCarrinho() {
    const vazio = document.getElementById('carrinho-vazio');
    const cheio = document.getElementById('carrinho-cheio');
    const ul = document.getElementById('lista-carrinho');

    function desenhar() {
      const lista = carrinho();
      vazio.hidden = lista.length > 0; cheio.hidden = lista.length === 0;
      ul.innerHTML = lista.map((i, n) => `<li class="item glass" data-n="${n}">
        ${i.foto ? `<img class="item-foto" src="${esc(i.foto)}" alt="">` : ''}
        <div class="item-info"><strong>${esc(i.nome)}</strong>
          <span>${i.tamanho ? 'Tamanho ' + esc(i.tamanho) : 'Tamanho único'}${i.desconto ? ' · -' + i.desconto + '%' : ''}</span></div>
        <div class="qtd"><button type="button" data-acao="menos" aria-label="Diminuir">−</button>
          <b>${i.qtd}</b><button type="button" data-acao="mais" aria-label="Aumentar">+</button></div>
        <button type="button" class="remover" data-acao="remover" aria-label="Remover">×</button></li>`).join('');
      const c = cupom();
      document.getElementById('cupom-area').hidden = !c;
      if (c) document.getElementById('cupom-codigo').textContent = c.codigo;
      atualizarContador();
    }

    ul.addEventListener('click', (e) => {
      const acao = e.target.dataset.acao; if (!acao) return;
      const n = Number(e.target.closest('.item').dataset.n);
      const lista = carrinho();
      if (acao === 'mais') lista[n].qtd += 1;
      if (acao === 'menos') lista[n].qtd -= 1;
      if (acao === 'remover' || lista[n].qtd < 1) lista.splice(n, 1);
      gravar(K_CARRINHO, lista); desenhar();
    });

    document.getElementById('finalizar').addEventListener('click', () => aoFinalizar(desenhar));
    desenhar();

    if (cupom()) {                                   // confere se o cupom guardado ainda vale
      fetch('/api/cupom/' + encodeURIComponent(cupom().codigo)).then((r) => r.json()).then((d) => {
        if (d.valido === false) { tirarCupom(true); desenhar(); aviso('Esse cupom já foi usado.'); }
      }).catch(() => {});
    }
  }

  // ---------- ao clicar em "Finalizar": oferta do cupom de 5% ----------
  // Quem ainda não tem (nem usou) cupom vê o pop-up com 2 caminhos:
  //   1) responder a pesquisa e ganhar o cupom  2) "Não quero o desconto"
  function aoFinalizar(redesenhar) {
    if (cupom() || usouCupom()) { finalizarNoWhatsApp(); return; }
    const estrelas = (grupo, nome) => `<div class="nota-estrelas" role="radiogroup" aria-label="${nome}" data-grupo="${grupo}">` +
      [1, 2, 3, 4, 5].map((n) => `<button type="button" class="nota-estrela" data-valor="${n}" role="radio" aria-checked="false" aria-label="${n} ${n === 1 ? 'estrela' : 'estrelas'}">★</button>`).join('') + '</div>';
    const j = janela(`<h2>Ganhe 5% de desconto</h2>
      <p class="pergunta">Responda a pesquisa rápida e ganhe um cupom de <b>5% de desconto</b> neste orçamento.</p>
      <form id="form-pesquisa">
        <fieldset><legend>O que você achou do visual do site?</legend>${estrelas('visual', 'Nota para o visual')}</fieldset>
        <fieldset><legend>Como você achou a organização do site?</legend>${estrelas('organizacao', 'Nota para a organização')}
          <div class="pontas"><span>Confusa</span><span>Muito fácil de usar</span></div></fieldset>
        <label for="coment">Quer deixar um comentário? Fica à vontade.</label>
        <textarea id="coment" rows="2" maxlength="600"></textarea>
        <p class="erro" id="erro-pesquisa" hidden></p>
        <button class="botao grande" type="submit">Enviar e ganhar o cupom</button>
      </form>
      <div class="escolhas">
        <button class="botao botao-vazado botao-discreto" type="button" id="sem-desconto">Não quero o desconto</button>
      </div>`);
    const resp = {visual: null, organizacao: null};
    const erro = j.raiz.querySelector('#erro-pesquisa');
    const botoes = j.raiz.querySelectorAll('.botao');
    const travar = (sim) => botoes.forEach((b) => { b.disabled = sim; });

    j.raiz.addEventListener('click', (e) => {
      const b = e.target.closest('.nota-estrela'); if (!b) return;
      const caixa = b.parentElement, valor = Number(b.dataset.valor);
      resp[caixa.dataset.grupo] = valor;
      caixa.querySelectorAll('.nota-estrela').forEach((x) => {
        const acesa = Number(x.dataset.valor) <= valor;
        x.classList.toggle('on', acesa); x.setAttribute('aria-checked', Number(x.dataset.valor) === valor);
      });
    });

    // Recebe a resposta do servidor: guarda o cupom e segue direto para o WhatsApp.
    function ganhou(r) {
      if (!r.ok) {
        erro.textContent = r.erro || 'Não consegui gerar o cupom agora. Tente de novo.'; erro.hidden = false; travar(false); return;
      }
      gravar(K_CUPOM, {codigo: r.cupom, percentual: r.percentual});
      redesenhar && redesenhar();
      j.fechar();
      aviso(`Cupom de ${r.percentual}% aplicado ✓`);
      finalizarNoWhatsApp();
    }

    j.raiz.querySelector('#form-pesquisa').addEventListener('submit', async (e) => {
      e.preventDefault();
      if (resp.visual === null || resp.organizacao === null) {
        erro.textContent = 'Escolha as estrelas nas duas perguntas.'; erro.hidden = false; return;
      }
      travar(true);
      ganhou(await enviar('/api/pesquisa', {...resp, comentario: j.raiz.querySelector('#coment').value}));
    });
    j.raiz.querySelector('#sem-desconto').addEventListener('click', () => {
      enviar('/api/evento', {tipo: 'recusou_desconto'});
      j.fechar();
      finalizarNoWhatsApp();
    });
  }

  // ---------- finalizar: abre o WhatsApp com a mensagem pronta ----------
  function montarMensagem() {
    const linhas = [];
    carrinho().forEach((i, n) => {
      const nome = i.nome.replace(/\*/g, '');
      linhas.push(`${n + 1}. ${nome} (cód. ${i.codigo})`);
      linhas.push(`   Tamanho: *${i.tamanho || 'a combinar'}* · Qtd: ${i.qtd}` + (i.desconto ? ` · desconto da peça: -${i.desconto}%` : ''));
    });
    const c = cupom();
    if (c) { linhas.push(''); linhas.push(`*CUPOM: ${c.codigo} (${c.percentual}% de desconto)*`); }
    return linhas.join('\n');
  }

  const usouCupom = () => { try { return !!localStorage.getItem(K_USADO); } catch (_) { return false; } };
  function tirarCupom(marcarUsado) {
    try { localStorage.removeItem(K_CUPOM); if (marcarUsado) localStorage.setItem(K_USADO, '1'); } catch (_) { /* ok */ }
  }

  async function finalizarNoWhatsApp() {
    const numero = document.body.dataset.whatsapp;
    if (/^5500000/.test(numero)) { aviso('O número do WhatsApp ainda não foi configurado.'); return; }
    const botao = document.getElementById('finalizar'); if (botao) botao.disabled = true;
    let mensagem = montarMensagem();                // monta ANTES de mexer no cupom
    let cupomValeu = false;
    // Cada cupom vale para UM orçamento só: o servidor confere e já marca como usado.
    if (cupom()) {
      const r = await enviar('/api/cupom/usar', {codigo: cupom().codigo});
      if (r.motivo === 'erro' || (r.ok === false && !r.motivo)) {
        aviso('Não consegui validar o cupom agora. Tente de novo.'); if (botao) botao.disabled = false; return;
      }
      cupomValeu = !!r.ok;
      tirarCupom(true);
      if (!cupomValeu) {                            // já usado (ou inválido): segue sem o cupom
        aviso('Esse cupom já foi usado, então ele não vale mais.');
        mensagem = montarMensagem();                // agora sem a linha do cupom
        await new Promise((ok) => setTimeout(ok, 1400));
      }
    }
    const itens = carrinho().reduce((s, i) => s + i.qtd, 0);
    enviar('/api/evento', {tipo: 'orcamento', itens, cupom: cupomValeu ? 'usado' : ''});
    window.location.href = `https://wa.me/${numero}?text=${encodeURIComponent(mensagem)}`;
  }

  // Voltou do WhatsApp para o site: libera o botão de finalizar de novo
  window.addEventListener('pageshow', () => { const b = document.getElementById('finalizar'); if (b) b.disabled = false; });

  // ---------- início ----------
  document.addEventListener('DOMContentLoaded', () => { atualizarContador(); iniciarCatalogo(); });
  return {iniciarCarrinho, montarMensagem};
})();

// Navegação mais rápida: quando o dedo (ou o mouse) encosta num link do site, a próxima página já começa a baixar.
(() => {
  const feitos = new Set();
  const adiantar = (e) => {
    const a = e.target.closest && e.target.closest('a[href^="/"]');
    if (!a || feitos.has(a.href) || a.href === location.href) return;
    feitos.add(a.href);
    const l = document.createElement('link'); l.rel = 'prefetch'; l.href = a.href; document.head.appendChild(l);
  };
  document.addEventListener('touchstart', adiantar, {passive: true});
  document.addEventListener('mouseover', adiantar, {passive: true});
})();

// Carrossel de trabalhos: setas rolam uma foto por vez
document.querySelectorAll('.carrossel-wrap').forEach(w => {
  const c = w.querySelector('.carrossel');
  w.querySelector('.seta-e').onclick = () => c.scrollBy({left: -300, behavior: 'smooth'});
  w.querySelector('.seta-d').onclick = () => c.scrollBy({left: 300, behavior: 'smooth'});
});

// Foto que não carrega -> imagem provisória (substitui o antigo onerror escrito no HTML, que a política de segurança bloqueia)
document.addEventListener('error', (e) => {
  const img = e.target;
  if (img && img.tagName === 'IMG' && img.dataset.ph && img.src.indexOf(img.dataset.ph) === -1) img.src = img.dataset.ph;
}, true);
